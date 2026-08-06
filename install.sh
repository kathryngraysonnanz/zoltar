#!/bin/sh
#
# Nia CLI Installer
#
# One-line installation script for Nia CLI on Unix-like systems (Linux, macOS)
# Supports automated platform detection and downloads from the public GitHub repository
#
# Optional Authentication:
#   Method 1: GitHub CLI (Recommended for interactive use)
#     gh release download --repo telerik/project-nia --pattern 'install.sh'
#     sh install.sh
#
#   Method 2: Token Authentication (Recommended for CI/CD)
#     curl -fsSL -H "Authorization: token $GITHUB_TOKEN" \
#       -o install.sh \
#       https://github.com/telerik/project-nia/releases/latest/download/install.sh
#     sh install.sh
#
# Options:
#   --stable          Install latest stable release (default)
#   --pre-release     Install latest pre-release
#   --version X.Y.Z   Install specific version
#   --skip-verify     Skip SHA256 checksum verification (NOT RECOMMENDED)
#   --quiet, -q       Minimal output (errors and warnings still shown)
#   --dry-run         Show what would be installed without installing
#   --install-dir DIR Custom installation directory (default: /usr/local/bin)
#   -h, --help        Show usage information
#
# Environment Variables:
#   GITHUB_TOKEN       GitHub personal access token (if gh CLI not available)
#   GH_TOKEN           Alternative to GITHUB_TOKEN
#   NIA_VERSION        Override version selection
#   NIA_CHANNEL        Override channel (stable/prerelease)
#   NIA_INSTALL_PATH   Override installation directory
#   NIA_SKIP_VERIFY    Skip verification (true/false)
#
# Exit Codes:
#   0 - Success
#   1 - General error (invalid arguments, missing files, etc.)
#   2 - Unsupported platform
#   3 - Authentication failure
#   4 - Network/download failure
#   5 - Verification failure
#   6 - Installation failure (permissions, etc.)
#
# Version: 1.0.0
# Repository: https://github.com/telerik/project-nia
#

set -eu

# ===================================================================
# Global Constants
# ===================================================================

REPO="telerik/project-nia"
REPOSITORY_VISIBILITY="public"
DEFAULT_INSTALL_DIR="/usr/local/bin"
SCRIPT_VERSION="1.0.0"

# ===================================================================
# Color Output Support
# ===================================================================

# Detect terminal capabilities
if [ -t 1 ] && command -v tput >/dev/null 2>&1; then
    # Terminal supports colors
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    BOLD=$(tput bold)
    RESET=$(tput sgr0)
else
    # No color support
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    BOLD=""
    RESET=""
fi

# ===================================================================
# Logging Functions
# ===================================================================

log_info() {
    if [ "${QUIET:-false}" != "true" ]; then
        printf "%s[INFO]%s %s\n" "$BLUE" "$RESET" "$1"
    fi
}

log_success() {
    if [ "${QUIET:-false}" != "true" ]; then
        printf "%s[SUCCESS]%s %s\n" "$GREEN" "$RESET" "$1"
    fi
}

log_warning() {
    if [ "${QUIET:-false}" != "true" ]; then
        printf "%s[WARNING]%s %s\n" "$YELLOW" "$RESET" "$1" >&2
    fi
}

log_error() {
    printf "%s[ERROR]%s %s\n" "$RED" "$RESET" "$1" >&2
}

github_api_get() {
    if [ "$AUTH_METHOD" = "token" ]; then
        curl -sS -H "Authorization: token $AUTH_TOKEN" "$1"
    else
        curl -sS "$1"
    fi
}

github_download() {
    destination="$1"
    url="$2"

    if [ "$AUTH_METHOD" = "token" ]; then
        curl -sS -L -H "Authorization: token $AUTH_TOKEN" \
            -H "Accept: application/octet-stream" \
            -o "$destination" "$url"
    else
        curl -sS -L -H "Accept: application/octet-stream" \
            -o "$destination" "$url"
    fi
}

# ===================================================================
# Cleanup Handler
# ===================================================================

TMPDIR=""

cleanup() {
    if [ -n "$TMPDIR" ] && [ -d "$TMPDIR" ]; then
        log_info "Cleaning up temporary files..."
        rm -rf "$TMPDIR"
    fi
}

trap cleanup EXIT INT TERM

# ===================================================================
# Usage Information
# ===================================================================

show_usage() {
    cat << EOF
${BOLD}Nia CLI Installer${RESET} v${SCRIPT_VERSION}

${BOLD}Usage:${RESET}
  curl -fsSL <URL> | sh [options]
  ./install.sh [options]

${BOLD}Options:${RESET}
  --stable              Install latest stable release (default)
  --pre-release         Install latest pre-release
  --version X.Y.Z       Install specific version
  --skip-verify         Skip SHA256 checksum verification (NOT RECOMMENDED)
  --quiet, -q           Minimal output
  --dry-run             Show what would be installed without installing
  --install-dir DIR     Custom installation directory (default: $DEFAULT_INSTALL_DIR)
  -h, --help            Show this help message

${BOLD}Environment Variables:${RESET}
  GITHUB_TOKEN          GitHub personal access token
  GH_TOKEN              Alternative to GITHUB_TOKEN
  NIA_VERSION           Override version selection
  NIA_CHANNEL           Override channel (stable/prerelease)
  NIA_INSTALL_PATH      Override installation directory
  NIA_SKIP_VERIFY       Skip verification (true/false)

${BOLD}Examples:${RESET}
  # Install latest stable release
  curl -fsSL <URL> | sh

  # Install latest pre-release
  curl -fsSL <URL> | sh -s -- --pre-release

  # Install specific version
  curl -fsSL <URL> | sh -s -- --version 4.0.1

  # Install to custom directory
  curl -fsSL <URL> | sh -s -- --install-dir ~/.local/bin

${BOLD}Authentication:${RESET}
  Authentication is optional for the public repository.
  GitHub CLI, GITHUB_TOKEN, or GH_TOKEN credentials may be used to increase
  GitHub API rate limits.

${BOLD}Exit Codes:${RESET}
  0 - Success
  1 - General error
  2 - Unsupported platform
  3 - Authentication failure
  4 - Network/download failure
  5 - Verification failure
  6 - Installation failure

EOF
}

# ===================================================================
# Existing Installation Check
# ===================================================================

# Compare semantic versions with pre-release support
# Returns: 0 if v1 < v2, 1 if v1 == v2, 2 if v1 > v2
compare_versions() {
    v1="$1"
    v2="$2"

    # Strip leading 'v' if present
    v1="${v1#v}"
    v2="${v2#v}"

    # If versions are identical, return equal
    if [ "$v1" = "$v2" ]; then
        return 1
    fi

    # Extract base versions (before any pre-release suffix)
    v1_base=$(echo "$v1" | sed 's/[-+].*//')
    v2_base=$(echo "$v2" | sed 's/[-+].*//')

    # Extract pre-release suffixes
    v1_pre=$(echo "$v1" | grep -o '[-].*' | sed 's/^-//' || echo "")
    v2_pre=$(echo "$v2" | grep -o '[-].*' | sed 's/^-//' || echo "")

    # Compare base versions using sort -V
    if [ "$v1_base" != "$v2_base" ]; then
        if printf '%s\n' "$v1_base" "$v2_base" | sort -V | head -n1 | grep -q "^$v1_base$"; then
            return 0  # v1 < v2
        else
            return 2  # v1 > v2
        fi
    fi

    # Base versions are equal, compare pre-release tags
    # Stable (no suffix) is always greater than pre-release
    if [ -z "$v1_pre" ] && [ -n "$v2_pre" ]; then
        return 2  # v1 (stable) > v2 (pre-release)
    elif [ -n "$v1_pre" ] && [ -z "$v2_pre" ]; then
        return 0  # v1 (pre-release) < v2 (stable)
    elif [ -n "$v1_pre" ] && [ -n "$v2_pre" ]; then
        # Both are pre-releases, compare alphabetically
        if [ "$v1_pre" = "$v2_pre" ]; then
            return 1  # Equal
        elif printf '%s\n' "$v1_pre" "$v2_pre" | sort | head -n1 | grep -q "^$v1_pre$"; then
            return 0  # v1 < v2
        else
            return 2  # v1 > v2
        fi
    fi

    # Should not reach here, but return equal as fallback
    return 1
}

check_existing_installation() {
    if command -v nia >/dev/null 2>&1; then
        CURRENT_VERSION=$(nia --version 2>/dev/null | awk '{print $2}')
        CURRENT_PATH=$(command -v nia)

        log_info "Found existing installation:"
        log_info "  Version: $CURRENT_VERSION"
        log_info "  Path: $CURRENT_PATH"

        # Check for pre-release to stable downgrade
        NEW_VERSION="${RELEASE_TAG#v}"

        # Compare versions using improved semantic version comparison
        compare_versions "$CURRENT_VERSION" "$NEW_VERSION"
        CMP_RESULT=$?

        case $CMP_RESULT in
            0)  # Current < New (upgrade)
                log_info "Upgrading from $CURRENT_VERSION to $NEW_VERSION"
                ;;
            1)  # Current == New (same)
                log_info "Same version already installed ($NEW_VERSION)"
                ;;
            2)  # Current > New (downgrade)
                if echo "$CURRENT_VERSION" | grep -qE '[-](alpha|beta|rc|dev)' && ! echo "$NEW_VERSION" | grep -qE '[-](alpha|beta|rc|dev)'; then
                    log_warning "Switching from pre-release $CURRENT_VERSION to stable $NEW_VERSION"
                else
                    log_warning "Downgrading from $CURRENT_VERSION to $NEW_VERSION"
                fi
                ;;
        esac
    else
        log_info "No existing nia installation found"
    fi
}

# ===================================================================
# Binary Download
# ===================================================================

download_binary() {
    log_info "Downloading nia binary..."

    # Create temp directory
    TMPDIR=$(mktemp -d)
    log_info "Using temporary directory: $TMPDIR"

    if [ "$AUTH_METHOD" = "gh" ]; then
        # Use gh CLI to download release assets
        # Download both binary and checksums in one call for efficiency
        cd "$TMPDIR" || exit 1
        if ! gh release download "$RELEASE_TAG" --repo "$REPO" \
            --pattern "$BINARY_PATTERN" --pattern "SHA256SUMS" 2>/dev/null; then
            log_error "Failed to download binary matching pattern: $BINARY_PATTERN"
            log_error "Release: $RELEASE_TAG"
            exit 4
        fi
        cd - >/dev/null || exit 1
    else
        # Use curl with API token
        # First get the asset download URL
        API_URL="https://api.github.com/repos/$REPO/releases/tags/$RELEASE_TAG"
        RELEASE_INFO=$(github_api_get "$API_URL")

        # Extract browser_download_url for matching asset
        ASSET_URL=$(echo "$RELEASE_INFO" | grep -o "\"browser_download_url\": *\"[^\"]*${ARCH_NORMALIZED}-${OS_NORMALIZED}[^\"]*\"" | cut -d'"' -f4 | head -n1)

        if [ -z "$ASSET_URL" ]; then
            log_error "Binary not found for platform: ${ARCH_NORMALIZED}-${OS_NORMALIZED}"
            log_error "Release: $RELEASE_TAG"
            exit 2
        fi

        log_info "Asset URL: $ASSET_URL"

        # Preserve the actual asset filename so checksum verification can
        # match it exactly in SHA256SUMS (a generic name like "nia" is a
        # substring of every entry and breaks lookup).
        ASSET_FILENAME=$(basename "$ASSET_URL")

        # Download binary (GitHub requires Accept header for release assets)
        if ! github_download "$TMPDIR/$ASSET_FILENAME" "$ASSET_URL"; then
            log_error "Failed to download binary"
            exit 4
        fi
    fi

    # Find downloaded binary
    DOWNLOADED_BINARY=$(find "$TMPDIR" -name "nia-*" -o -name "nia" | head -n1)

    if [ -z "$DOWNLOADED_BINARY" ] || [ ! -f "$DOWNLOADED_BINARY" ]; then
        log_error "Downloaded binary not found in $TMPDIR"
        ls -la "$TMPDIR"
        exit 1
    fi

    log_success "Downloaded: $(basename "$DOWNLOADED_BINARY")"
}

# ===================================================================
# Checksum Verification
# ===================================================================

download_checksums() {
    log_info "Downloading checksums..."

    CHECKSUM_FILE="$TMPDIR/SHA256SUMS"

    # Check if already downloaded (gh CLI downloads both in one call)
    if [ -f "$CHECKSUM_FILE" ]; then
        log_success "SHA256SUMS already downloaded"
        return 0
    fi

    if [ "$AUTH_METHOD" = "gh" ]; then
        cd "$TMPDIR" || return 1
        if ! gh release download "$RELEASE_TAG" --repo "$REPO" --pattern "SHA256SUMS" 2>/dev/null; then
            log_warning "SHA256SUMS not found in release"
            cd - >/dev/null || return 1
            return 1
        fi
        cd - >/dev/null || return 1
    else
        # Use curl with token
        CHECKSUM_URL=$(github_api_get \
            "https://api.github.com/repos/$REPO/releases/tags/$RELEASE_TAG" | \
            grep -o '"browser_download_url": *"[^"]*SHA256SUMS"' | \
            cut -d'"' -f4)

        if [ -z "$CHECKSUM_URL" ]; then
            log_warning "SHA256SUMS not found in release"
            return 1
        fi

        if ! github_download "$CHECKSUM_FILE" "$CHECKSUM_URL"; then
            log_warning "Failed to download SHA256SUMS"
            return 1
        fi
    fi

    if [ -f "$CHECKSUM_FILE" ]; then
        log_success "Downloaded SHA256SUMS"
        return 0
    fi

    return 1
}

verify_checksum() {
    if [ ! -f "$CHECKSUM_FILE" ]; then
        log_warning "No checksum file available - skipping verification"
        return 0
    fi

    log_info "Verifying SHA256 checksum..."

    BINARY_NAME=$(basename "$DOWNLOADED_BINARY")

    # Extract expected checksum for this binary. Match the filename field
    # exactly (ignoring an optional "./" prefix or "*" binary marker) rather
    # than a substring, since a substring match can hit multiple SHA256SUMS
    # entries (e.g. every "nia-*" asset contains "nia").
    EXPECTED_CHECKSUM=$(awk -v name="$BINARY_NAME" '
        { f = $2; sub(/^\*/, "", f); sub(/^\.\//, "", f); if (f == name) { print $1; exit } }
    ' "$CHECKSUM_FILE")

    if [ -z "$EXPECTED_CHECKSUM" ]; then
        log_warning "Binary not found in checksum file"
        log_warning "Checksum verification cannot be performed"
        log_warning "This may indicate an incomplete release. Proceed with caution."
        return 0
    fi

    # Calculate actual checksum using available tool
    if command -v sha256sum >/dev/null 2>&1; then
        ACTUAL_CHECKSUM=$(sha256sum "$DOWNLOADED_BINARY" | awk '{print $1}')
    elif command -v shasum >/dev/null 2>&1; then
        ACTUAL_CHECKSUM=$(shasum -a 256 "$DOWNLOADED_BINARY" | awk '{print $1}')
    elif command -v openssl >/dev/null 2>&1; then
        ACTUAL_CHECKSUM=$(openssl dgst -sha256 "$DOWNLOADED_BINARY" | awk '{print $2}')
    else
        log_warning "No SHA256 tool available (sha256sum, shasum, or openssl)"
        log_warning "Skipping checksum verification"
        return 0
    fi

    # Compare checksums
    if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
        log_success "Checksum verified: $ACTUAL_CHECKSUM"
        return 0
    else
        log_error "Checksum verification FAILED!"
        log_error "Expected: $EXPECTED_CHECKSUM"
        log_error "Actual:   $ACTUAL_CHECKSUM"
        echo ""
        log_error "The downloaded binary may be corrupted or tampered with."
        log_error "Please try again or download manually from GitHub releases."
        exit 5
    fi
}

# ===================================================================
# Binary Installation
# ===================================================================

install_binary() {
    log_info "Installing to $INSTALL_DIR..."

    # Check if we need sudo
    NEED_SUDO="false"
    if [ ! -w "$INSTALL_DIR" ]; then
        if [ "$(id -u)" -ne 0 ]; then
            NEED_SUDO="true"
            log_info "Installation requires elevated privileges"
        fi
    fi

    # Create install directory if needed
    if [ ! -d "$INSTALL_DIR" ]; then
        if [ "$NEED_SUDO" = "true" ]; then
            sudo mkdir -p "$INSTALL_DIR"
        else
            mkdir -p "$INSTALL_DIR"
        fi
    fi

    # Make binary executable
    chmod +x "$DOWNLOADED_BINARY"

    # Copy binary
    if [ "$NEED_SUDO" = "true" ]; then
        sudo cp "$DOWNLOADED_BINARY" "$INSTALL_DIR/nia"
        sudo chmod 755 "$INSTALL_DIR/nia"
    else
        cp "$DOWNLOADED_BINARY" "$INSTALL_DIR/nia"
        chmod 755 "$INSTALL_DIR/nia"
    fi

    log_success "Installed nia to $INSTALL_DIR/nia"

    # Remove macOS quarantine attribute (if on macOS)
    if [ "$OS_NORMALIZED" = "darwin" ]; then
        log_info "Removing macOS quarantine attribute..."
        if [ "$NEED_SUDO" = "true" ]; then
            sudo xattr -d com.apple.quarantine "$INSTALL_DIR/nia" 2>/dev/null || true
        else
            xattr -d com.apple.quarantine "$INSTALL_DIR/nia" 2>/dev/null || true
        fi
        log_success "Quarantine attribute removed"
    fi

    # Verify installation
    if [ -x "$INSTALL_DIR/nia" ]; then
        INSTALLED_VERSION=$("$INSTALL_DIR/nia" --version 2>/dev/null | head -n1)
        log_success "Binary verified: $INSTALLED_VERSION"
        log_info "Installation directory: $INSTALL_DIR"
    else
        log_error "Installation verification failed"
        exit 6
    fi
}

# ===================================================================
# Argument Parsing
# ===================================================================

parse_arguments() {
    CHANNEL="stable"
    VERSION=""
    SKIP_VERIFY="false"
    QUIET="false"
    DRY_RUN="false"
    INSTALL_DIR="${NIA_INSTALL_PATH:-$DEFAULT_INSTALL_DIR}"

    while [ $# -gt 0 ]; do
        case "$1" in
            --stable)
                CHANNEL="stable"
                shift
                ;;
            --pre-release)
                CHANNEL="prerelease"
                shift
                ;;
            --version)
                if [ -z "${2:-}" ]; then
                    log_error "--version requires a version argument"
                    exit 1
                fi
                VERSION="$2"
                shift 2
                ;;
            --skip-verify)
                SKIP_VERIFY="true"
                shift
                ;;
            --quiet|-q)
                QUIET="true"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --install-dir)
                if [ -z "${2:-}" ]; then
                    log_error "--install-dir requires a path argument"
                    exit 1
                fi
                INSTALL_DIR="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Environment variable overrides (take precedence over flags)
    [ -n "${NIA_VERSION:-}" ] && VERSION="$NIA_VERSION"
    [ -n "${NIA_CHANNEL:-}" ] && CHANNEL="$NIA_CHANNEL"
    [ "${NIA_SKIP_VERIFY:-}" = "true" ] && SKIP_VERIFY="true"

    log_info "Configuration:"
    log_info "  Channel: $CHANNEL"
    [ -n "$VERSION" ] && log_info "  Version: $VERSION"
    log_info "  Install directory: $INSTALL_DIR"
    log_info "  Skip verify: $SKIP_VERIFY"
}

# ===================================================================
# Release Selection
# ===================================================================

get_latest_release() {
    log_info "Finding latest $CHANNEL release..."

    if [ -n "$VERSION" ]; then
        # Specific version requested
        RELEASE_TAG="v$VERSION"
        log_info "Requested version: $VERSION"
        return 0
    fi

    if [ "$AUTH_METHOD" = "gh" ]; then
        # Use gh CLI to list releases (tab-separated: TITLE, TYPE, TAG, DATE)
        RELEASE_LIST=$(gh release list --repo "$REPO" --limit 50)

        if [ "$CHANNEL" = "prerelease" ]; then
            # Get newest release regardless of type (first line, third field)
            RELEASE_TAG=$(echo "$RELEASE_LIST" | head -n1 | cut -f3)
        else
            # Get newest "Latest" (stable) release - grep for "Latest" in TYPE field, get TAG field
            RELEASE_TAG=$(echo "$RELEASE_LIST" | grep "Latest" | head -n1 | cut -f3)
        fi
    else
        # Use GitHub API with token
        API_URL="https://api.github.com/repos/$REPO/releases"
        RELEASES=$(github_api_get "$API_URL")

        if [ "$CHANNEL" = "prerelease" ]; then
            # Get first release (newest)
            RELEASE_TAG=$(echo "$RELEASES" | grep -o '"tag_name": *"[^"]*"' | head -n1 | cut -d'"' -f4)
        else
            # Get first non-prerelease
            RELEASE_TAG=$(echo "$RELEASES" | grep -B5 '"prerelease": *false' | grep -o '"tag_name": *"[^"]*"' | head -n1 | cut -d'"' -f4)
        fi
    fi

    if [ -z "$RELEASE_TAG" ]; then
        log_error "No $CHANNEL release found"
        exit 1
    fi

    log_success "Found release: $RELEASE_TAG"
}

validate_version() {
    if [ -n "$VERSION" ]; then
        # Check if version exists
        if [ "$AUTH_METHOD" = "gh" ]; then
            if ! gh release view "v$VERSION" --repo "$REPO" >/dev/null 2>&1; then
                log_error "Version $VERSION not found"
                log_info "Available versions:"
                gh release list --repo "$REPO" --limit 10
                exit 1
            fi
        fi
    fi
}

# ===================================================================
# Authentication
# ===================================================================

check_authentication() {
    log_info "Checking authentication..."

    # Method 1: GitHub CLI
    if command -v gh >/dev/null 2>&1; then
        if gh auth status >/dev/null 2>&1; then
            AUTH_METHOD="gh"
            log_success "Authenticated via GitHub CLI"
            return 0
        fi
    fi

    # Method 2: GITHUB_TOKEN environment variable
    if [ -n "${GITHUB_TOKEN:-}" ]; then
        AUTH_METHOD="token"
        AUTH_TOKEN="$GITHUB_TOKEN"
        log_success "Authenticated via GITHUB_TOKEN"
        return 0
    fi

    # Method 3: GH_TOKEN environment variable (alternative)
    if [ -n "${GH_TOKEN:-}" ]; then
        AUTH_METHOD="token"
        AUTH_TOKEN="$GH_TOKEN"
        log_success "Authenticated via GH_TOKEN"
        return 0
    fi

    if [ "$REPOSITORY_VISIBILITY" = "public" ]; then
        AUTH_METHOD="anonymous"
        AUTH_TOKEN=""
        log_info "Using anonymous access to the public repository"
        return 0
    fi

    # No authentication available
    log_error "No authentication method available"
    echo ""
    echo "To install nia, you need one of:"
    echo "  1. GitHub CLI authenticated: gh auth login"
    echo "  2. GITHUB_TOKEN environment variable set"
    echo "  3. GH_TOKEN environment variable set"
    echo ""
    echo "The repository is private and requires authentication."
    exit 3
}

# ===================================================================
# Platform Detection
# ===================================================================

detect_platform() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"

    log_info "Detecting platform..."

    # Normalize OS
    case "$OS" in
        Linux)
            OS_NORMALIZED="linux"
            ;;
        Darwin)
            OS_NORMALIZED="darwin"
            ;;
        *)
            log_error "Unsupported operating system: $OS"
            log_error "Supported: Linux, macOS (Darwin)"
            exit 2
            ;;
    esac

    # Normalize architecture
    # Note: macOS uses arm64, Linux typically uses aarch64
    case "$ARCH" in
        x86_64|amd64)
            ARCH_NORMALIZED="x86_64"
            ;;
        aarch64|arm64)
            ARCH_NORMALIZED="aarch64"
            ;;
        *)
            log_error "Unsupported architecture: $ARCH"
            log_error "Supported: x86_64 (Intel/AMD), aarch64/arm64 (Apple Silicon/ARM)"
            exit 2
            ;;
    esac

    # Set binary pattern for download
    BINARY_PATTERN="nia-*-${ARCH_NORMALIZED}-${OS_NORMALIZED}"

    log_success "Detected platform: $OS_NORMALIZED ($ARCH_NORMALIZED)"
    log_info "Binary pattern: $BINARY_PATTERN"
}

# ===================================================================
# Main Entry Point
# ===================================================================

main() {
    # Parse command-line arguments
    parse_arguments "$@"

    log_info "Nia CLI Installer v${SCRIPT_VERSION}"
    log_info "Repository: $REPO"

    # Detect platform
    detect_platform

    # Check authentication
    check_authentication

    # Validate specific version if requested
    validate_version

    # Get release to install
    get_latest_release

    # Dry-run mode: show what would be installed and exit
    if [ "$DRY_RUN" = "true" ]; then
        echo ""
        log_info "${BOLD}[DRY RUN] Installation Preview${RESET}"
        log_info "Would install: nia $RELEASE_TAG"
        log_info "To directory: $INSTALL_DIR"
        log_info "Binary pattern: $BINARY_PATTERN"
        log_info "Platform: $OS_NORMALIZED ($ARCH_NORMALIZED)"
        log_info "Channel: $CHANNEL"
        log_info "Verification: $([ "$SKIP_VERIFY" = "true" ] && echo "disabled" || echo "enabled")"
        echo ""
        log_success "Dry run complete - no files were modified"
        exit 0
    fi

    # Check for existing installation
    check_existing_installation

    # Download binary
    download_binary

    # Verify checksum (unless skipped)
    if [ "$SKIP_VERIFY" != "true" ]; then
        if download_checksums; then
            verify_checksum
        fi
    else
        log_warning "Checksum verification skipped (--skip-verify)"
    fi

    # Install binary
    install_binary

    echo ""
    log_success "✓ Nia CLI installed successfully!"
    echo ""
    echo "Run 'nia --version' to verify installation"
    echo "Run 'nia --help' to get started"
    echo ""
    echo "To uninstall: sudo rm -f $INSTALL_DIR/nia"
    echo ""
}

# Run main function if not being sourced
if [ "${1:-}" != "--source-only" ]; then
    main "$@"
fi
