#!/usr/bin/env python3

"""
Filesystem Check and Repair Tool
A Python-based tool for diagnosing and repairing filesystem issues
with support for multiple filesystem types and repair options.
"""

import os
import sys
import subprocess
import argparse
import json
from pathlib import Path
from typing import Optional, Dict, Tuple, List
from enum import Enum

# Color codes for terminal output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

class FilesystemType(Enum):
    EXT2 = "ext2"
    EXT3 = "ext3"
    EXT4 = "ext4"
    XFS = "xfs"
    BTRFS = "btrfs"
    NTFS = "ntfs"
    FAT = "fat"
    VFAT = "vfat"
    UNKNOWN = "unknown"

class FsckTool:
    """Main class for filesystem check and repair operations"""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.device = None
        self.filesystem_type = FilesystemType.UNKNOWN
        self.is_mounted = False
        self.mount_point = None
        
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
        
    def print_header(self, message: str):
        """Print cyan header message"""
        print(f"{Colors.CYAN}{'='*60}{Colors.NC}")
        print(f"{Colors.CYAN}{message.center(60)}{Colors.NC}")
        print(f"{Colors.CYAN}{'='*60}{Colors.NC}")
        
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
    
    def detect_filesystem_type(self, device: str) -> FilesystemType:
        """Detect filesystem type of a device"""
        self.print_info(f"Detecting filesystem type for {device}...")
        
        # Try blkid first
        code, stdout, _ = self.run_command(f"blkid -o value -s TYPE {device}", check=False)
        if code == 0:
            fstype = stdout.strip().lower()
            for fs in FilesystemType:
                if fs.value == fstype:
                    return fs
        
        # Try file command
        code, stdout, _ = self.run_command(f"file -s {device}", check=False)
        if code == 0:
            output = stdout.lower()
            if "ext4" in output:
                return FilesystemType.EXT4
            elif "ext3" in output:
                return FilesystemType.EXT3
            elif "ext2" in output:
                return FilesystemType.EXT2
            elif "xfs" in output:
                return FilesystemType.XFS
            elif "btrfs" in output:
                return FilesystemType.BTRFS
            elif "ntfs" in output:
                return FilesystemType.NTFS
        
        return FilesystemType.UNKNOWN
    
    def check_if_mounted(self, device: str) -> Tuple[bool, Optional[str]]:
        """Check if device is mounted and return mount point"""
        code, stdout, _ = self.run_command(f"mount | grep {device}", check=False)
        if code == 0:
            # Parse mount point from output
            parts = stdout.split()
            if len(parts) >= 3:
                mount_point = parts[2]
                return True, mount_point
            return True, None
        return False, None
    
    def list_devices(self) -> Dict[str, Dict]:
        """List all available devices"""
        self.print_info("Listing available devices...")
        code, stdout, _ = self.run_command("lsblk -o NAME,SIZE,TYPE,FSTYPE -J", check=False)
        
        if code != 0:
            self.print_warning("Could not list devices with lsblk")
            return {}
        
        try:
            import json
            data = json.loads(stdout)
            devices = {}
            
            def parse_devices(block_devices, parent_name=""):
                for device in block_devices:
                    name = device.get('name')
                    full_path = f"/dev/{name}"
                    devices[full_path] = {
                        'size': device.get('size'),
                        'type': device.get('type'),
                        'fstype': device.get('fstype', 'unknown')
                    }
                    if 'children' in device:
                        parse_devices(device['children'])
            
            parse_devices(data.get('blockdevices', []))
            return devices
        except json.JSONDecodeError:
            return {}
    
    def fsck_ext(self, device: str, repair: bool = False, verbose: bool = False) -> bool:
        """Check and repair ext2/3/4 filesystems"""
        self.print_status(f"Checking {'and repairing ' if repair else ''}{device}...")
        
        # Build fsck command
        cmd = "e2fsck"
        flags = "-v" if verbose else ""
        
        if repair:
            # -p: preen (automatic repair)
            # -y: assume yes to all questions
            flags += " -p"
        else:
            # -n: read-only check
            flags += " -n"
        
        command = f"{cmd} {flags} {device}"
        
        self.print_info(f"Running: {command}")
        code, stdout, stderr = self.run_command(command, check=False)
        
        print(stdout)
        if stderr:
            print(stderr)
        
        return code in [0, 1, 2]  # 0=no errors, 1=errors corrected, 2=reboot needed
    
    def fsck_xfs(self, device: str, repair: bool = False) -> bool:
        """Check and repair XFS filesystems"""
        self.print_status(f"Checking XFS {'and repairing ' if repair else ''}{device}...")
        
        if repair:
            # XFS repair tool
            command = f"xfs_repair {device}"
        else:
            # Read-only check
            command = f"xfs_admin -l {device}"
        
        self.print_info(f"Running: {command}")
        code, stdout, stderr = self.run_command(command, check=False)
        
        print(stdout)
        if stderr:
            print(stderr)
        
        return code == 0
    
    def fsck_btrfs(self, device: str, repair: bool = False) -> bool:
        """Check and repair Btrfs filesystems"""
        self.print_status(f"Checking Btrfs {'and repairing ' if repair else ''}{device}...")
        
        if repair:
            # Btrfs repair command
            command = f"btrfs check --repair {device}"
        else:
            # Read-only check
            command = f"btrfs check {device}"
        
        self.print_info(f"Running: {command}")
        code, stdout, stderr = self.run_command(command, check=False)
        
        print(stdout)
        if stderr:
            print(stderr)
        
        return code == 0
    
    def fsck_ntfs(self, device: str, repair: bool = False) -> bool:
        """Check and repair NTFS filesystems"""
        self.print_status(f"Checking NTFS {'and repairing ' if repair else ''}{device}...")
        
        if repair:
            # NTFS repair
            command = f"ntfsfix --d {device}"
        else:
            # Read-only check
            command = f"ntfsfix --no-action {device}"
        
        self.print_info(f"Running: {command}")
        code, stdout, stderr = self.run_command(command, check=False)
        
        print(stdout)
        if stderr:
            print(stderr)
        
        return code == 0
    
    def fsck_device(self, device: str, repair: bool = False, interactive: bool = True) -> bool:
        """Perform filesystem check on device"""
        if not os.path.exists(device):
            self.print_error(f"Device not found: {device}")
            return False
        
        # Check if device is mounted
        is_mounted, mount_point = self.check_if_mounted(device)
        if is_mounted:
            self.print_warning(f"Device is mounted at {mount_point}")
            if not repair:
                self.print_info("Running read-only check on mounted filesystem")
            else:
                self.print_error("Cannot repair mounted filesystem!")
                self.print_info(f"Unmount {device} first: sudo umount {mount_point}")
                return False
        
        # Detect filesystem type
        fstype = self.detect_filesystem_type(device)
        self.print_info(f"Detected filesystem type: {fstype.value}")
        
        if fstype == FilesystemType.UNKNOWN:
            self.print_error("Unknown filesystem type")
            return False
        
        # Show what will happen
        self.print_header(f"FSCK Report for {device}")
        print(f"Device: {device}")
        print(f"Filesystem: {fstype.value}")
        print(f"Mode: {'REPAIR' if repair else 'READ-ONLY CHECK'}")
        print()
        
        if repair and interactive:
            response = input(f"Proceed with repair? (y/n): ").strip().lower()
            if response not in ['y', 'yes']:
                self.print_warning("Cancelled")
                return False
        
        # Run appropriate fsck tool
        if fstype in [FilesystemType.EXT2, FilesystemType.EXT3, FilesystemType.EXT4]:
            return self.fsck_ext(device, repair=repair, verbose=self.verbose)
        elif fstype == FilesystemType.XFS:
            return self.fsck_xfs(device, repair=repair)
        elif fstype == FilesystemType.BTRFS:
            return self.fsck_btrfs(device, repair=repair)
        elif fstype == FilesystemType.NTFS:
            return self.fsck_ntfs(device, repair=repair)
        else:
            self.print_error(f"Unsupported filesystem type: {fstype.value}")
            return False
    
    def interactive_mode(self):
        """Interactive mode for device selection"""
        self.print_header("Filesystem Check and Repair Tool")
        print()
        
        # List devices
        devices = self.list_devices()
        if not devices:
            self.print_error("No devices found")
            sys.exit(1)
        
        # Filter out loop and ramdisk devices
        physical_devices = {
            k: v for k, v in devices.items() 
            if not k.startswith('/dev/loop') and not k.startswith('/dev/ram')
        }
        
        if not physical_devices:
            self.print_warning("No physical devices found, showing all devices:")
            physical_devices = devices
        
        print("Available devices:")
        for i, (device, info) in enumerate(physical_devices.items(), 1):
            print(f"  {i}. {device}: {info.get('size', 'N/A')} - {info.get('fstype', 'unknown')}")
        
        # Select device
        choice = input("\nSelect device number: ").strip()
        try:
            idx = int(choice) - 1
            self.device = list(physical_devices.keys())[idx]
        except (ValueError, IndexError):
            self.print_error("Invalid selection")
            sys.exit(1)
        
        # Detect filesystem
        self.filesystem_type = self.detect_filesystem_type(self.device)
        
        # Ask for repair mode
        repair_choice = input("\nPerform repair? (y/n, default: n): ").strip().lower()
        repair = repair_choice in ['y', 'yes']
        
        # Run fsck
        self.fsck_device(self.device, repair=repair, interactive=True)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Filesystem Check and Repair Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Interactive mode
  sudo python3 fsck-tool.py

  # Check device (read-only)
  sudo python3 fsck-tool.py -d /dev/sda1

  # Repair device
  sudo python3 fsck-tool.py -d /dev/sda1 --repair

  # List devices
  sudo python3 fsck-tool.py --list-devices

  # Auto-detect and repair (dangerous!)
  sudo python3 fsck-tool.py -d /dev/sda1 --repair -y

  # Verbose output
  sudo python3 fsck-tool.py -d /dev/sda1 -v
        '''
    )
    
    parser.add_argument('-d', '--device', help='Device to check (e.g., /dev/sda1)')
    parser.add_argument('--repair', action='store_true', help='Attempt to repair filesystem')
    parser.add_argument('--list-devices', action='store_true', help='List all devices and exit')
    parser.add_argument('-y', '--yes', action='store_true', help='Skip confirmations (dangerous!)')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Check if running as root
    if not os.geteuid() == 0:
        print(f"{Colors.RED}[-]{Colors.NC} This script must be run as root")
        sys.exit(1)
    
    # Create tool instance
    tool = FsckTool(verbose=args.verbose)
    
    # List devices and exit
    if args.list_devices:
        devices = tool.list_devices()
        print("\nAvailable devices:")
        for device, info in devices.items():
            print(f"  {device}: {info.get('size', 'N/A')} - {info.get('fstype', 'unknown')}")
        return
    
    # Run with device argument
    if args.device:
        tool.device = args.device
        tool.fsck_device(args.device, repair=args.repair, interactive=not args.yes)
    else:
        # Interactive mode
        tool.interactive_mode()

if __name__ == '__main__':
    main()
