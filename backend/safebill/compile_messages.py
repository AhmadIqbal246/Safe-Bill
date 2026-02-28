#!/usr/bin/env python
"""Compile .po files to .mo files using polib"""
import os
import polib
from pathlib import Path

def compile_po_to_mo():
    """Compile all .po files in locale directories to .mo files"""
    locale_dir = Path(__file__).parent / 'locale'
    
    if not locale_dir.exists():
        print(f"Locale directory not found: {locale_dir}")
        return
    
    compiled_count = 0
    for po_file in locale_dir.rglob('*.po'):
        try:
            # Load the .po file
            po = polib.pofile(str(po_file))
            
            # Create .mo file path
            mo_file = po_file.with_suffix('.mo')
            
            # Save as .mo file
            po.save_as_mofile(str(mo_file))
            print(f"✓ Compiled: {po_file.relative_to(locale_dir)} → {mo_file.name}")
            compiled_count += 1
        except Exception as e:
            print(f"✗ Error compiling {po_file}: {e}")
    
    print(f"\nTotal compiled: {compiled_count} files")

if __name__ == '__main__':
    compile_po_to_mo()
