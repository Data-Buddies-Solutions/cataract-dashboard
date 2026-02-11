# PDF Form Filling Guide

## Workflow Overview

### Step 1: Check if PDF has fillable fields
```bash
python scripts/check_fillable_fields.py <file.pdf>
```

### Step 2: For Fillable PDFs

1. Extract field information:
```bash
python scripts/extract_form_field_info.py <file.pdf>
```

2. Convert to PNG for visual analysis:
```bash
python scripts/convert_pdf_to_images.py <file.pdf>
```

3. Create `field_values.json` mapping field IDs to values:
```json
{
  "field_name_1": "value1",
  "field_name_2": "value2"
}
```

4. Fill the form:
```bash
python scripts/fill_fillable_fields.py <file.pdf> field_values.json output.pdf
```

### Step 3: For Non-Fillable PDFs

#### Approach A: Structure-Based
Extract text labels and form elements:
```bash
python scripts/extract_form_structure.py <file.pdf>
```

This provides exact PDF coordinates for text elements, lines, and checkboxes. Analyze the structure to identify field positions, then create `fields.json` with calculated entry coordinates.

#### Approach B: Visual Estimation
For scanned documents:
1. Convert PDF to images
2. Manually identify field locations
3. Use zoom cropping with ImageMagick to refine coordinate precision
4. Create `fields.json` with estimated coordinates

#### Hybrid Approach
Combine both methods — use structure extraction where available and visual estimation for missed elements. Convert all coordinates to a single system before filling.

### Step 4: Validation

Always validate bounding boxes before filling:
```bash
python scripts/check_bounding_boxes.py <file.pdf> fields.json
```

Then fill:
```bash
python scripts/fill_pdf_form_with_annotations.py <file.pdf> fields.json output.pdf
```

Finally, convert output to images to verify text placement accuracy:
```bash
python scripts/convert_pdf_to_images.py output.pdf
```
