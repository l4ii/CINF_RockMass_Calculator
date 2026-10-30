# QA report
- Source sufficiency: notes-only
- Output: presentation_zh.pptx
- Slide count / dimensions: 14 / 13.33 × 7.50 in (16:9)

## content QA
- Status: pass with explicit placeholders and attribution
- Evidence and limitations: The narrative follows the user-provided five-minute talk and the supplied six-slide template. Editable text, diagrams, and placeholders are used throughout; the actual RMR UI screenshot is labeled as fictional demo input. Engineering point counts, labor savings, traceability rate, IP records, sales quantities, and AI R&D investment remain placeholders. The approximately CNY 150 million contract scenario and proposed CNY 500,000 base license + CNY 500,000 AI module pricing are labeled as project-provided/internal assumptions requiring confirmation. Contract value is not presented as software revenue. Agent orchestration and visual recognition are visibly labeled as architecture/flow concepts awaiting demonstration or measured evidence.
- No formal project report, financial records, IP certificates, or real visual-recognition results were supplied; none were invented.

## structural QA
- Status: pass
- Reopen, media, notes, sources, bounds: Reopened with python-pptx. Packaged inspector passed: 14 slides, 12 media parts, 14 notes slide parts, no broken relationships, no out-of-bounds objects, no warnings or errors. Result slides have visible source labels and speaker notes. Main content is editable PowerPoint text and shapes.

## visual QA
- Status: unavailable
- Renderer and inspected previews: Preflight found no LibreOffice/soffice renderer, and no PowerPoint executable was found in standard Office locations. The final PPTX could not be rendered for slide-by-slide visual inspection; text fit, template image crop, and font substitution should be checked in PowerPoint.

## Unresolved issues
- Slide 4 / content / impact: replace workload placeholders with approved, de-identified project statistics.
- Slides 7–8 / content / maturity: add real agent runtime and visual-recognition screenshots; repository inspection confirms local text-model invocation and context injection but not a complete tool-orchestration or image-recognition chain.
- Slides 9–10 / content / legal: insert official IP certificates and accurately label granted or pending status.
- Slide 12 / content / impact: add matched manual/software time measurements and traceability sampling results.
- Slide 13 / content / finance: verify the CNY 150 million scenario scope and as-of date; approve pricing and enter sales forecast and AI R&D costs.
- All slides / visual / impact: open the PPTX in the target PowerPoint environment and inspect typography, image cropping, and page transitions.

## Completion state
- Status: structurally-verified-with-disclosure
