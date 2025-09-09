# Electron Assets

This directory contains the assets needed for Electron Builder.

Since actual icon files (.ico) are binary and cannot be included in this text-based project, 
the build configuration has been updated to use the existing vite.svg as a temporary icon.

For production, replace with proper Windows icons:
- icon.ico (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- installer-icon.ico (for NSIS installer)
- uninstaller-icon.ico (for NSIS uninstaller)

The current configuration will work for testing purposes using the vite.svg as fallback.