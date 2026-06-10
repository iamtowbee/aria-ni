#!/usr/bin/env bash
# ============================================================
#  lubuntu-grub-boot/install.sh
#  1. Wipe & partition a target disk (default: /dev/sdb)
#  2. Download Lubuntu IS
#  3. Configure GRUB2 loopback boot from internal drive
#  Supports: Arch Linux hos
#  Usage:  sudo bash install.sh [--disk /dev/sdb] [--version 24.04.1] [--isodir /boot] [--skip-format]
# ============================================================

set -euo pipefail

# ── Colours ─────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
die()     { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

# ── Defaults ────────────────────────────────────────────────
LUBUNTU_VERSION="24.04.4"
ISO_DIR="/boot"
ISO_NAME="lubuntu.iso"
GRUB_CUSTOM="/etc/grub.d/40_custom"
GRUB_CFG="/boot/grub/grub.cfg"
TARGET_DISK="/dev/sdb"
SKIP_FORMAT=false

# ── Arg parsing ─────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --version)     LUBUNTU_VERSION="$2"; shift 2 ;;
    --isodir)      ISO_DIR="$2";         shift 2 ;;
    --disk)        TARGET_DISK="$2";     shift 2 ;;
    --skip-format) SKIP_FORMAT=true;     shift   ;;
    --help|-h)
      echo "Usage: sudo bash install.sh [--disk /dev/sdb] [--version 24.04.1] [--isodir /boot] [--skip-format]"
      exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
done

ISO_PATH="${ISO_DIR}/${ISO_NAME}"
# CDN path: /releases/24.04.4/release/lubuntu-24.04.4-desktop-amd64.iso
ISO_URL="https://cdimage.ubuntu.com/lubuntu/releases/${LUBUNTU_VERSION}/release/lubuntu-${LUBUNTU_VERSION}-desktop-amd64.iso"

# ── Guards ───────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "Run as root: sudo bash install.sh"
command -v grub-mkconfig &>/dev/null || die "grub-mkconfig not found. Install grub package first."
command -v parted       &>/dev/null || die "parted not found. Run: sudo pacman -S parted"
command -v mkfs.ext4    &>/dev/null || die "mkfs.ext4 not found. Run: sudo pacman -S e2fsprogs"

# ── Step 0: Wipe & partition /dev/sdb ────────────────────────
echo ""
echo -e "${BOLD}=== Lubuntu GRUB2 Loopback Boot Installer ===${RESET}"
echo ""

if [[ "$SKIP_FORMAT" == true ]]; then
  warn "--skip-format passed — skipping disk wipe of ${TARGET_DISK}."
else
  # Safety: confirm the disk exists and is NOT the system disk
  [[ -b "$TARGET_DISK" ]] || die "Disk $TARGET_DISK not found. Check with: lsblk"

  ROOT_DISK=$(lsblk -no pkname "$(findmnt -n -o SOURCE /)" 2>/dev/null | head -1)
  ROOT_DISK="/dev/${ROOT_DISK}"
  if [[ "$TARGET_DISK" == "$ROOT_DISK" ]]; then
    die "ABORT: $TARGET_DISK is your root disk ($ROOT_DISK). Refusing to wipe."
  fi

  # Unmount any mounted partitions on target disk
  info "Unmounting any partitions on ${TARGET_DISK}..."
  for part in $(lsblk -ln -o NAME "$TARGET_DISK" | tail -n +2); do
    mountpoint -q "/dev/${part}" && umount -f "/dev/${part}" && info "Unmounted /dev/${part}" || true
  done

  # Show current state
  echo ""
  info "Current layout of ${TARGET_DISK}:"
  lsblk -f "$TARGET_DISK" || true
  echo ""

  # Confirm before wiping
  echo -e "${RED}${BOLD}⚠ WARNING: This will ERASE ALL DATA on ${TARGET_DISK}${RESET}"
  echo -e "  Detected as: $(lsblk -dno MODEL,SIZE "$TARGET_DISK" 2>/dev/null || echo 'unknown')"
  echo ""
  read -r -p "  Type YES to confirm wipe of ${TARGET_DISK}: " CONFIRM
  [[ "$CONFIRM" == "YES" ]] || die "Aborted by user."

  # Wipe existing signatures and partition table
  info "Wiping existing data and partition table on ${TARGET_DISK}..."
  wipefs -a "$TARGET_DISK"
  dd if=/dev/zero of="$TARGET_DISK" bs=1M count=10 status=none
  sync

  # Create fresh GPT partition table + single ext4 partition
  info "Creating new GPT partition table on ${TARGET_DISK}..."
  parted -s "$TARGET_DISK" mklabel gpt
  parted -s "$TARGET_DISK" mkpart primary ext4 1MiB 100%
  partprobe "$TARGET_DISK"
  sleep 1

  # Determine partition name (sdb1 or sdb1 for nvme: nvme1n1p1)
  if [[ "$TARGET_DISK" =~ nvme ]]; then
    TARGET_PART="${TARGET_DISK}p1"
  else
    TARGET_PART="${TARGET_DISK}1"
  fi

  info "Formatting ${TARGET_PART} as ext4..."
  mkfs.ext4 -F -L "lubuntu-data" "$TARGET_PART"
  sync

  success "${TARGET_DISK} wiped and formatted as ext4 (${TARGET_PART}, label: lubuntu-data)"
  echo ""
  info "New layout:"
  lsblk -f "$TARGET_DISK"
  echo ""
fi

# ── Step 1: Download ISO ─────────────────────────────────────
echo ""
echo -e "${BOLD}=== Lubuntu GRUB2 Loopback Boot Installer ===${RESET}"
echo ""

if [[ -f "$ISO_PATH" ]]; then
  warn "ISO already exists at $ISO_PATH — skipping download."
  warn "Delete it and re-run if you want a fresh copy."
else
  info "Downloading Lubuntu ${LUBUNTU_VERSION} ISO..."
  info "Source: $ISO_URL"
  info "Destination: $ISO_PATH"
  echo ""

  # Prefer aria2c for speed, fall back to wget, then curl
  if command -v aria2c &>/dev/null; then
    aria2c --out="$ISO_PATH" --dir="/" --continue=true \
      --max-connection-per-server=4 --split=4 "$ISO_URL"
  elif command -v wget &>/dev/null; then
    wget --show-progress -O "$ISO_PATH" "$ISO_URL"
  elif command -v curl &>/dev/null; then
    curl -L --progress-bar -o "$ISO_PATH" "$ISO_URL"
  else
    die "No download tool found. Install wget, curl, or aria2c."
  fi

  success "ISO downloaded to $ISO_PATH"
fi

# ── Step 2: Detect GRUB boot partition ──────────────────────
echo ""
info "Detecting boot partition for GRUB device path..."

BOOT_DEV=$(df "$ISO_DIR" | tail -1 | awk '{print $1}')
info "Boot device: $BOOT_DEV"

# Determine GRUB hd/part numbering via grub-probe
if command -v grub-probe &>/dev/null; then
  GRUB_DRIVE=$(grub-probe --target=drive "$ISO_DIR" 2>/dev/null || echo "")
  if [[ -n "$GRUB_DRIVE" ]]; then
    success "GRUB drive path: $GRUB_DRIVE"
  else
    warn "grub-probe returned empty. Defaulting to (hd0,1) — you may need to adjust."
    GRUB_DRIVE="(hd0,1)"
  fi
else
  warn "grub-probe not available. Defaulting to (hd0,1) — verify with: lsblk -f"
  GRUB_DRIVE="(hd0,1)"
fi

# Determine the ISO path relative to the GRUB boot partition root
# If /boot is its own partition, the file is at /lubuntu.iso from GRUB's view
# If /boot lives on root /, the file is at /boot/lubuntu.iso
BOOT_MOUNTPOINT=$(df --output=target "$ISO_DIR" | tail -1)
if [[ "$BOOT_MOUNTPOINT" == "$ISO_DIR" ]]; then
  GRUB_ISO_PATH="/${ISO_NAME}"
  info "Detected: /boot is its own partition → GRUB ISO path: $GRUB_ISO_PATH"
else
  GRUB_ISO_PATH="${ISO_DIR}/${ISO_NAME}"
  info "Detected: /boot is on root partition → GRUB ISO path: $GRUB_ISO_PATH"
fi

# ── Step 3: Write GRUB custom entry ──────────────────────────
echo ""
info "Writing GRUB2 custom menu entry to $GRUB_CUSTOM..."

GRUB_ENTRY="
### BEGIN lubuntu-grub-boot ###
menuentry 'Lubuntu ${LUBUNTU_VERSION} Install (loopback)' {
  insmod part_gpt
  insmod part_msdos
  insmod ext2
  insmod iso9660
  insmod loopback
  set isofile=\"${GRUB_ISO_PATH}\"
  loopback loop ${GRUB_DRIVE}\$isofile
  linux  (loop)/casper/vmlinuz boot=casper iso-scan/filename=\$isofile quiet splash ---
  initrd (loop)/casper/initrd
}
### END lubuntu-grub-boot ###
"

# Remove any old entry if present
if grep -q "lubuntu-grub-boot" "$GRUB_CUSTOM" 2>/dev/null; then
  warn "Existing entry found in $GRUB_CUSTOM — replacing it."
  # Remove block between markers
  sed -i '/### BEGIN lubuntu-grub-boot ###/,/### END lubuntu-grub-boot ###/d' "$GRUB_CUSTOM"
fi

echo "$GRUB_ENTRY" >> "$GRUB_CUSTOM"
chmod +x "$GRUB_CUSTOM"
success "Entry written."

# ── Step 4: Regenerate grub.cfg ──────────────────────────────
echo ""
info "Regenerating $GRUB_CFG ..."
grub-mkconfig -o "$GRUB_CFG"
success "GRUB config updated."

# ── Step 5: Verify entry ──────────────────────────────────────
echo ""
info "Verifying entry in grub.cfg..."
if grep -q "Lubuntu" "$GRUB_CFG"; then
  success "Entry confirmed in $GRUB_CFG"
else
  warn "Entry not found in grub.cfg — check $GRUB_CUSTOM manually."
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}=== All done! ===${RESET}"
echo ""
if [[ "$SKIP_FORMAT" == false ]]; then
echo -e "  Disk wiped   : ${CYAN}${TARGET_DISK} → ${TARGET_DISK}1 (ext4, lubuntu-data)${RESET}"
fi
echo -e "  ISO location : ${CYAN}${ISO_PATH}${RESET}"
echo -e "  GRUB entry   : ${CYAN}${GRUB_CUSTOM}${RESET}"
echo -e "  GRUB config  : ${CYAN}${GRUB_CFG}${RESET}"
echo ""
echo -e "  ${BOLD}Reboot and select:${RESET} 'Lubuntu ${LUBUNTU_VERSION} Install (loopback)'"
echo ""
echo -e "${YELLOW}Tip:${RESET} If boot fails at the GRUB entry, check GRUB drive path with:"
echo -e "       grub-probe --target=drive /boot"
echo -e "     Then edit ${GRUB_CUSTOM} and re-run: sudo grub-mkconfig -o ${GRUB_CFG}"
echo ""
