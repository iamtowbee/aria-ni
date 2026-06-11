#!/usr/bin/env python3

"""
GRUB Bootloader Recovery Tool
A Python-based tool for diagnosing and repairing GRUB bootloader issues
with interactive and command-line argument support.
"""

import os
import sys
import subprocess
import argparse
import json
from pathlib import Path
from typing import Optional, Dict, Tuple
from enum import Enum
import shutil

# Color codes for terminal output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

class SystemType(Enum):
    BIOS = "bios"
    EFI = "efi"
    UNKNOWN = "unknown"

class GrubRepair:
    """Main class for GRUB bootloader repair operations"""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.mount_point = "/mnt/lubuntu"
        self.disk = None
        self.partition = None
        self.efi_partition = None
        self.system_type = SystemType.UNKNOWN
        self.config = {}
        
    def print_status(self, message: str):
        """Print green status message"""
        print(f"{Colors.GREEN}[+]{Colors.NC} {message}")
        
    def print_error(self, message: str):
        """Print red error message"""
        print(f"{Colors.RED}[-]{Colors.NC} {message}")
        
    def print_warning(self, message: str):
        """Print yellow warning message"""
        print(f"{Colors.YELLOW}[!]{Colors.NC} {message}")
        
    def print_info(self, message: str):
        """Print blue info message"""
        print(f"{Colors.BLUE}[i]{Colors.NC} {message}")
        
    def run_command(self, command: str, check: bool = True) -> Tuple[int, str, str]:
        """Execute shell command and return exit code, stdout, stderr"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                check=False
            )
            if self.verbose:
                self.print_info(f"Command: {command}")
                if result.stdout:
                    print(f"  Output: {result.stdout[:200]}")
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            if check:
                self.print_error(f"Failed to execute command: {e}")
                sys.exit(1)
            return 1, "", str(e)
    
    def check_root(self) -> bool:
        """Check if script is running as root"""
        return os.geteuid() == 0
    
    def list_disks(self) -> Dict[str, Dict]:
        """List all available disks and their properties"""
        self.print_info("Listing available disks...")
        code, stdout, _ = self.run_command("lsblk -d -o NAME,SIZE,TYPE,MODEL -J", check=False)
        
        if code != 0:
            code, stdout, _ = self.run_command("lsblk -d -o NAME,SIZE,TYPE", check=False)
            print(stdout)
            return {}
        
        try:
            data = json.loads(stdout)
            disks = {}
            for device in data.get('blockdevices', []):
                name = device.get('name')
                disks[f"/dev/{name}"] = {
                    'size': device.get('size'),
                    'type': device.get('type'),
                    'model': device.get('model', 'N/A')
                }
            return disks
        except json.JSONDecodeError:
            return {}
    
    def list_partitions(self, disk: str) -> Dict[str, Dict]:
        """List all partitions on a specific disk"""
        self.print_info(f"Listing partitions on {disk}...")
        code, stdout, _ = self.run_command(f"lsblk {disk} -o NAME,SIZE,FSTYPE -J", check=False)
        
        if code != 0:
            code, stdout, _ = self.run_command(f"lsblk {disk} -o NAME,SIZE,FSTYPE", check=False)
            print(stdout)
            return {}
        
        try:
            data = json.loads(stdout)
            partitions = {}
            for device in data.get('blockdevices', []):
                name = device.get('name')
                if 'children' in device:
                    for child in device['children']:
                        part_name = child.get('name')
                        partitions[f"/dev/{part_name}"] = {
                            'size': child.get('size'),
                            'fstype': child.get('fstype', 'unknown')
                        }
            return partitions
        except json.JSONDecodeError:
            return {}
    
    def auto_detect(self) -> bool:
        """Auto-detect disk and partitions"""
        self.print_status("Auto-detecting disk and partitions...")
        
        # Detect main disk
        code, stdout, _ = self.run_command("lsblk -nd -o NAME | grep -E '^(sda|nvme|vda)' | head -1", check=False)
        if code != 0:
            self.print_error("Could not detect main disk")
            return False
        
        disk_name = stdout.strip()
        self.disk = f"/dev/{disk_name}"
        
        # Detect partitions
        code, stdout, _ = self.run_command(f"lsblk -nd -o NAME,TYPE {self.disk} | grep part | awk '{{print $1}}' | head -1", check=False)
        if code != 0:
            self.print_error("Could not detect partitions")
            return False
        
        part_name = stdout.strip()
        self.partition = f"/dev/{part_name}"
        
        # Detect EFI partition
        code, stdout, _ = self.run_command(
            f"lsblk -nd -o NAME,TYPE,FSTYPE {self.disk} | grep -E 'part.*vfat|part.*EFI' | head -1 | awk '{{print $1}}'",
            check=False
        )
        
        if code == 0 and stdout.strip():
            efi_name = stdout.strip()
            self.efi_partition = f"/dev/{efi_name}"
            self.system_type = SystemType.EFI
        else:
            self.system_type = SystemType.BIOS
        
        self.print_status("Auto-detect results:")
        print(f"  Disk: {self.disk}")
        print(f"  Root Partition: {self.partition}")
        print(f"  System Type: {self.system_type.value.upper()}")
        if self.efi_partition:
            print(f"  EFI Partition: {self.efi_partition}")
        
        return True
    
    def interactive_mode(self):
        """Interactive mode for user input"""
        self.print_status("GRUB Bootloader Recovery Tool")
        print()
        self.print_info("Please provide disk and partition information")
        print()
        
        # List and select disk
        disks = self.list_disks()
        if not disks:
            self.print_error("No disks found")
            sys.exit(1)
        
        print("\nAvailable disks:")
        for disk, info in disks.items():
            print(f"  {disk}: {info.get('size', 'N/A')} - {info.get('model', 'N/A')}")
        
        self.disk = input("\nEnter disk device (e.g., /dev/sda): ").strip()
        if not self.validate_device(self.disk):
            self.print_error(f"Invalid disk: {self.disk}")
            sys.exit(1)
        
        # List and select partition
        partitions = self.list_partitions(self.disk)
        if not partitions:
            self.print_error("No partitions found")
            sys.exit(1)
        
        print("\nPartitions on this disk:")
        for part, info in partitions.items():
            print(f"  {part}: {info.get('size', 'N/A')} - {info.get('fstype', 'unknown')}")
        
        self.partition = input("\nEnter root partition (e.g., /dev/sda2): ").strip()
        if not self.validate_device(self.partition):
            self.print_error(f"Invalid partition: {self.partition}")
            sys.exit(1)
        
        # Check for EFI
        efi_response = input("\nIs this an EFI system? (y/n): ").strip().lower()
        if efi_response in ['y', 'yes']:
            self.system_type = SystemType.EFI
            self.efi_partition = input("Enter EFI partition (e.g., /dev/sda1): ").strip()
            if not self.validate_device(self.efi_partition):
                self.print_error(f"Invalid EFI partition: {self.efi_partition}")
                sys.exit(1)
        else:
            self.system_type = SystemType.BIOS
        
        # Custom mount point
        mp_input = input("\nEnter mount point (default: /mnt/lubuntu): ").strip()
        if mp_input:
            self.mount_point = mp_input
    
    def validate_device(self, device: str) -> bool:
        """Validate if device exists"""
        return os.path.exists(device)
    
    def show_summary(self) -> bool:
        """Display configuration summary and ask for confirmation"""
        print()
        self.print_status("Configuration Summary:")
        print(f"  Mount Point: {self.mount_point}")
        print(f"  Disk: {self.disk}")
        print(f"  Root Partition: {self.partition}")
        print(f"  System Type: {self.system_type.value.upper()}")
        if self.efi_partition:
            print(f"  EFI Partition: {self.efi_partition}")
        print()
        
        response = input("Proceed with GRUB bootloader repair? (y/n): ").strip().lower()
        return response in ['y', 'yes']
    
    def mount_system(self) -> bool:
        """Mount the system and bind directories"""
        self.print_status(f"Creating mount point: {self.mount_point}")
        Path(self.mount_point).mkdir(parents=True, exist_ok=True)
        
        # Unmount if already mounted
        code, _, _ = self.run_command(f"mount | grep -q {self.mount_point}", check=False)
        if code == 0:
            self.print_warning("Mount point already in use, unmounting...")
            self.run_command(f"umount -R {self.mount_point}", check=False)
        
        # Mount root partition
        self.print_status(f"Mounting root partition: {self.partition}")
        code, _, stderr = self.run_command(f"mount {self.partition} {self.mount_point}")
        if code != 0:
            self.print_error(f"Failed to mount partition: {stderr}")
            return False
        
        # Mount EFI partition if applicable
        if self.system_type == SystemType.EFI and self.efi_partition:
            self.print_status(f"Mounting EFI partition: {self.efi_partition}")
            efi_path = Path(self.mount_point) / "boot" / "efi"
            efi_path.mkdir(parents=True, exist_ok=True)
            code, _, stderr = self.run_command(f"mount {self.efi_partition} {efi_path}")
            if code != 0:
                self.print_error(f"Failed to mount EFI partition: {stderr}")
                return False
        
        # Bind system directories
        self.print_status("Binding system directories...")
        for dir_name in ['dev', 'proc', 'sys', 'run']:
            code, _, _ = self.run_command(f"mount --bind /{dir_name} {self.mount_point}/{dir_name}")
            if code == 0:
                self.print_info(f"  Bound: {dir_name}")
        
        return True
    
    def repair_grub(self) -> bool:
        """Repair GRUB bootloader"""
        self.print_status("Entering chroot environment and repairing GRUB...")
        
        # Update package manager
        self.print_info("Updating package manager...")
        self.run_command(f"chroot {self.mount_point} apt-get update -qq", check=False)
        
        # Install GRUB packages
        if self.system_type == SystemType.EFI:
            self.print_info("Installing GRUB EFI packages...")
            self.run_command(
                f"chroot {self.mount_point} apt-get install -y grub-efi-amd64 grub-efi-amd64-signed",
                check=False
            )
        else:
            self.print_info("Installing GRUB BIOS packages...")
            self.run_command(
                f"chroot {self.mount_point} apt-get install -y grub-pc",
                check=False
            )
        
        # Install GRUB bootloader
        self.print_status(f"Installing GRUB bootloader on {self.disk}...")
        code, _, stderr = self.run_command(f"chroot {self.mount_point} grub-install {self.disk}", check=False)
        if code != 0:
            self.print_warning(f"GRUB install completed with warnings: {stderr[:100]}")
        
        # Install GRUB for EFI
        if self.system_type == SystemType.EFI:
            self.print_status("Installing GRUB for EFI mode...")
            code, _, stderr = self.run_command(
                f"chroot {self.mount_point} grub-install --efi-directory=/boot/efi {self.disk}",
                check=False
            )
            if code != 0:
                self.print_warning(f"EFI install completed with warnings: {stderr[:100]}")
        
        # Update GRUB configuration
        self.print_status("Updating GRUB configuration...")
        code, _, stderr = self.run_command(f"chroot {self.mount_point} update-grub")
        if code != 0:
            self.print_error(f"Failed to update GRUB configuration: {stderr}")
            return False
        
        return True
    
    def unmount_system(self):
        """Unmount all mounted directories"""
        self.print_status("Cleaning up and unmounting...")
        
        for dir_name in ['run', 'sys', 'proc', 'dev']:
            self.run_command(f"umount {self.mount_point}/{dir_name}", check=False)
        
        if self.system_type == SystemType.EFI and self.efi_partition:
            self.run_command(f"umount {self.mount_point}/boot/efi", check=False)
        
        self.run_command(f"umount {self.mount_point}", check=False)
    
    def save_config(self, config_file: str = "grub_config.json"):
        """Save configuration to JSON file"""
        config = {
            "mount_point": self.mount_point,
            "disk": self.disk,
            "partition": self.partition,
            "efi_partition": self.efi_partition,
            "system_type": self.system_type.value
        }
        
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        self.print_status(f"Configuration saved to {config_file}")
    
    def load_config(self, config_file: str) -> bool:
        """Load configuration from JSON file"""
        if not Path(config_file).exists():
            self.print_error(f"Configuration file not found: {config_file}")
            return False
        
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            self.mount_point = config.get('mount_point', self.mount_point)
            self.disk = config.get('disk')
            self.partition = config.get('partition')
            self.efi_partition = config.get('efi_partition')
            self.system_type = SystemType(config.get('system_type', 'unknown'))
            
            self.print_status(f"Configuration loaded from {config_file}")
            return True
        except (json.JSONDecodeError, ValueError) as e:
            self.print_error(f"Failed to load configuration: {e}")
            return False
    
    def run(self, skip_confirm: bool = False):
        """Run the complete repair process"""
        # Check if running as root
        if not self.check_root():
            self.print_error("This script must be run as root")
            sys.exit(1)
        
        # Get configuration
        if not self.disk or not self.partition:
            self.interactive_mode()
        
        # Show summary and confirm
        if not skip_confirm and not self.show_summary():
            self.print_warning("Operation cancelled")
            sys.exit(0)
        
        # Execute repair
        try:
            if not self.mount_system():
                sys.exit(1)
            
            if not self.repair_grub():
                sys.exit(1)
            
            self.unmount_system()
            
            print()
            self.print_status("✓ GRUB bootloader has been successfully repaired!")
            print()
            self.print_info("Next steps:")
            print("  1. Reboot your system: sudo reboot")
            print("  2. If issues persist, boot from Lubuntu Live USB for further diagnosis")
            print()
        
        except KeyboardInterrupt:
            self.print_warning("\nOperation interrupted by user")
            self.unmount_system()
            sys.exit(1)
        except Exception as e:
            self.print_error(f"Unexpected error: {e}")
            self.unmount_system()
            sys.exit(1)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='GRUB Bootloader Recovery Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Interactive mode
  sudo python3 fix-grub-bootloader.py

  # With arguments
  sudo python3 fix-grub-bootloader.py -d /dev/sda -p /dev/sda2 -e /dev/sda1 --efi

  # Auto-detect mode
  sudo python3 fix-grub-bootloader.py --auto-detect -y

  # Load configuration from file
  sudo python3 fix-grub-bootloader.py --config grub_config.json -y

  # Save configuration
  sudo python3 fix-grub-bootloader.py -d /dev/sda -p /dev/sda2 --save-config
        '''
    )
    
    parser.add_argument('-d', '--disk', help='Disk to install GRUB (e.g., /dev/sda)')
    parser.add_argument('-p', '--partition', help='Root partition (e.g., /dev/sda2)')
    parser.add_argument('-e', '--efi-partition', help='EFI partition (e.g., /dev/sda1)')
    parser.add_argument('-m', '--mount-point', default='/mnt/lubuntu', help='Mount point (default: /mnt/lubuntu)')
    parser.add_argument('--efi', action='store_true', help='Enable EFI mode')
    parser.add_argument('--non-efi', action='store_true', help='Disable EFI mode')
    parser.add_argument('--auto-detect', action='store_true', help='Auto-detect disk and partitions')
    parser.add_argument('--config', help='Load configuration from JSON file')
    parser.add_argument('--save-config', help='Save configuration to JSON file')
    parser.add_argument('-y', '--yes', action='store_true', help='Skip confirmations')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Create repair instance
    repair = GrubRepair(verbose=args.verbose)
    
    # Load configuration from file if specified
    if args.config:
        if not repair.load_config(args.config):
            sys.exit(1)
    else:
        # Set configuration from arguments
        if args.disk:
            repair.disk = args.disk
        if args.partition:
            repair.partition = args.partition
        if args.efi_partition:
            repair.efi_partition = args.efi_partition
        if args.mount_point:
            repair.mount_point = args.mount_point
        
        if args.efi:
            repair.system_type = SystemType.EFI
        elif args.non_efi:
            repair.system_type = SystemType.BIOS
        
        if args.auto_detect:
            if not repair.auto_detect():
                sys.exit(1)
    
    # Save configuration if requested
    if args.save_config:
        repair.save_config(args.save_config)
        return
    
    # Run repair process
    repair.run(skip_confirm=args.yes)

if __name__ == '__main__':
    main()
