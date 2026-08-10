import sys
import json
import re
import os
import zipfile
import base64
import io
from PIL import Image

def extract_docx_images_ordered(file_path):
    extracted_images = []
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            namelist = z.namelist()
            
            # 1. Read rels
            rels = {}
            for rel_path in namelist:
                if rel_path.startswith('word/_rels/') and rel_path.endswith('.rels'):
                    try:
                        rels_xml = z.read(rel_path).decode('utf-8', errors='ignore')
                        for match in re.finditer(r'Id=["\']([^"\']+)["\'][^>]*Target=["\']([^"\']+)["\']', rels_xml):
                            r_id, target = match.group(1), match.group(2)
                            if 'media/' in target:
                                if not target.startswith('word/'):
                                    target = 'word/' + target.lstrip('/')
                                rels[r_id] = target
                    except Exception:
                        pass

            # 2. Find image rIds in document.xml, header*.xml, footer*.xml in document order
            xml_files = [f for f in namelist if f.startswith('word/') and f.endswith('.xml') and not f.startswith('word/_rels/')]
            # Prioritize document.xml first
            xml_files.sort(key=lambda x: (0 if x == 'word/document.xml' else 1, x))

            ordered_media_paths = []
            for xml_file in xml_files:
                try:
                    xml_content = z.read(xml_file).decode('utf-8', errors='ignore')
                    for match in re.finditer(r'(?:r:embed|r:id)=["\']([^"\']+)["\']', xml_content):
                        r_id = match.group(1)
                        if r_id in rels:
                            media_path = rels[r_id]
                            if media_path in namelist:
                                ordered_media_paths.append(media_path)
                except Exception:
                    pass

            # 3. Add any media files that weren't referenced in XMLs
            all_media = [f for f in namelist if f.startswith('word/media/') and not f.endswith('/')]
            def sort_key(f):
                m = re.search(r'image(\d+)', f)
                return int(m.group(1)) if m else f
            all_media.sort(key=sort_key)

            for m_path in all_media:
                if m_path not in ordered_media_paths:
                    ordered_media_paths.append(m_path)

            # 4. Process image bytes in order
            for fname in ordered_media_paths:
                try:
                    img_bytes = z.read(fname)
                    if len(img_bytes) > 100:  # Allow small images, ignore 0-byte or tiny files
                        b64_str = None
                        try:
                            im = Image.open(io.BytesIO(img_bytes))
                            im.thumbnail((1800, 1800))
                            if im.mode in ("RGBA", "P", "LA"):
                                im = im.convert("RGB")
                            out = io.BytesIO()
                            im.save(out, format="JPEG", quality=85)
                            b64_str = "data:image/jpeg;base64," + base64.b64encode(out.getvalue()).decode('utf-8')
                        except Exception:
                            # Fallback for formats PIL might fail on (e.g. raw png/jpg)
                            ext = fname.split('.')[-1].lower()
                            mime = "image/jpeg" if ext in ["jpg", "jpeg"] else ("image/png" if ext == "png" else f"image/{ext}")
                            b64_str = f"data:{mime};base64," + base64.b64encode(img_bytes).decode('utf-8')
                        
                        if b64_str:
                            extracted_images.append(b64_str)
                except Exception as ie:
                    sys.stderr.write(f"Error processing {fname}: {ie}\n")

    except Exception as ze:
        sys.stderr.write(f"Zip extraction error: {ze}\n")

    return extracted_images

print("Test script loaded successfully")
