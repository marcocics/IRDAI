# YOLOX-S explorer style guide

These are the agreed design and interaction rules for the architecture explorer. Apply them to future stages and popups. Layer parameters and tensor shapes must come from the architecture, not from illustrative animations.

## Page and navigation

- The diagram fills the page. No page header, footer, explanatory sidebar, or permanent details panel.
- Start the diagram centered on reload.
- Show a large, subtle **YOLOX-S** watermark at the top left, without a surrounding box.
- Below it, provide a Home icon, **+ Expand all**, and **− Collapse all**. Controls are frameless.
- Home fits the currently visible diagram, including connections, below the overlay. Expand all and Collapse all also fit the resulting view.
- Drag empty space or a block to pan. A drag must not trigger expansion.
- Scroll to zoom around the pointer. Panning remains unrestricted.
- Use native layout zoom rather than scaling a composited layer, to keep text and edges sharp.

## Blocks

- Boxes represent operations or meaningful groups, not tensor dimensions.
- Keep titles on one line; widen the box to fit.
- Click only the Expand/Collapse text to toggle a group in place. Click the rest of a block to select it without changing expansion. Selection and toggle controls are separate accessible buttons. Clicking exposed group padding also selects the group.
- Preserve surrounding context by moving neighboring blocks to accommodate expansion.
- Align visible connection ports, rather than group-frame centers, so sequential arrows stay horizontal.
- Show the active block with a subtle background tint. Do not add a selection outline or change its border color. Preserve keyboard focus visibility.
- Clicking empty diagram space clears selection without collapsing blocks.
- Diagram text is not selectable.
- Put **CSPDarknet** directly below **Backbone** as a smaller subtitle.
- Do not show a generic “Details” label.

## Connections and dimensions

- Draw connections and arrowheads with SVG; do not use raster images or text arrow glyphs for diagram edges.
- Arrows must touch the visible operation frames. When a group is expanded, connect to its first or last visible operation, rather than stopping at its outer frame.
- Put tensor dimensions above horizontal connection segments, centered and unrotated. Use small, readable text; the current size is 11 px before zoom.
- Show dimensions on every connection whose tensor shape is defined, including repeated unchanged shapes. Do not invent shapes for overview-only stages.
- Use **C × H × W** on arrows, omitting the batch dimension. Explain **B × C × H × W** when batch size matters in a popup.
- Use the multiplication sign **×**, not the letter x.
- Give horizontal segments enough length for their labels. Do not place dimensions on bends or vertical segments.
- Use the same neutral color for all architecture arrows, including the three neck inputs.
- Each input to a merge operation must have its own arrowhead entering that operation. Do not imply that values merge at an unlabeled wire intersection.
- Use right-angle splits when branches need different heights; avoid diagonal branch connections.
- Do not draw decorative vertical guide lines around branches.

### Backbone and neck

- The collapsed Backbone has three distinct arrows to the Neck, labeled with the dark3, dark4, and dark5 output shapes.
- With the Backbone expanded, route dark3 above, dark4 below, and dark5 straight right into the Neck.
- Routed paths must clear both connected frames, even when one is taller.

### CSP and residual paths

- Expanding CSP exposes its two branches directly. Do not show an extra “Two branches” wrapper heading.
- Omit “Deeper,” “Shorter,” “F(A),” and “A” lane labels.
- Represent identity shortcuts as wires, not Identity boxes.
- For CSP concatenation, the upper branch enters from the left and the lower branch enters from below.
- Residual paths have two horizontal arrows into Elementwise add, one above the other, including when the paths group is collapsed.
- Grow a receiving block when necessary to accommodate its input ports.

### Parallel pooling

- Represent the unpooled path as a wire, not an Identity box.
- Omit “Unpooled,” “5×5,” and similar lane labels; the pooling operation names carry their parameters.
- Four arrows enter SPP Concatenate horizontally, both when Parallel pooling is collapsed and when it is expanded.
- Adjust the Concatenate block height to fit the expanded paths.

## Operation notation

| Operation | Display |
|---|---|
| Convolution | `32×Conv(3×3, s=1)` |
| Convolution group | `32×Conv(3×3, s=1) → BN → SiLU` |
| Max pooling | `MaxPool(5×5, s=1)` |
| Concatenation example | `(32+32) × 160 × 160 → 64 × 160 × 160` |

- Use each layer's actual output-channel count, spatial kernel size, and stride.
- Keep `s=1` explicit. Do not use the former long subscript notation.
- Use math typography for expressions in prose, including f′(x), L(w), and dL/dw.
- Use MathML for displayed fractions, roots, matrices, and scripts. Keep formulas centered and prevent unwanted line breaks.
- For variance with a statistics subscript, attach both scripts to σ using `msubsup`, so the exponent is not placed after the subscript.

## Popup behavior

- Blocks with explanations have a small circled i button in the bottom right. Use a separate accessible button, not a nested button inside the operation button.
- Click the information button to toggle its popup. Hovering or focusing a block must not open it. Enter and Space activate the information button normally.
- Keep the popup open while interacting with it or moving the pointer away. Close on an outside click, Escape, pan/zoom, resize, or window blur. Stop animations when closed.
- Clicking within a popup, selecting its text, or operating its navigation must not dismiss it.
- Popup text is selectable. Hide the blinking text caret; keep the mouse pointer visible. Navigation controls are not text-selectable.
- Constrain popups to the viewport. Allow scrolling when necessary, but hide scrollbars.
- Use an opaque theme-aware surface, a subtle border, rounded corners, and a restrained shadow above the diagram.
- Keep content concise. Remove redundant notes and unused empty space.
- For slides, put small **‹**, step counter, and **›** controls immediately after the popup title. Navigation is manual and wraps around.
- Keep the formula area and graph geometry consistent across slides. Do not add large blank areas merely to equalize text lengths; longer content can scroll.
- Convolution animations belong to individual Conv blocks, not the enclosing Conv → BN → SiLU group.

## Animations and explanations

- Use SVG for diagrams, grids, channel stacks, and curves. Use native HTML/MathML for text and formulas.
- Restart animations from the beginning when their popup opens. Stop their animation frames when it closes or the window loses focus.
- Recover hover behavior when returning to the browser or tab. Clamp negative elapsed frame times to zero, so stale frame timestamps cannot crash an animation.
- Make one transformation easy to follow at a time. Use actual operation parameters, while clearly identifying small illustrative data examples.
- In 3D-looking stacks, update back-to-front drawing order as objects move.
- Use theme variables for surfaces, text, borders, and highlights. Branch colors distinguish feature sources; BGR colors are appropriate only where channels actually represent BGR.

### Spatial rearrangement

- Animate BGR triples together, one triple at a time.
- Build each output column fully before moving to the next. Within a 2×2 input patch, use row/column order `(0,0) → (1,0) → (0,1) → (1,1)`.
- Preserve every value and the BGR order within each triple.
- Below the animation, show only the centered transformation **3 × H × W → 12 × H/2 × W/2**. Omit numerical example dimensions and explanatory notes.

### Convolution

- Show kernel weights on the left, a moving window over the image in the center, and progressively filled output on the right.
- Use illustrative nonuniform weights. Hide weights on the moving window so pixel values remain readable.
- Display **Weighted sum = …**, spatial kernel size, stride, and zero-padding width.
- State the actual full filter shape and input-channel count. The single-channel example is only one contribution to a full filter's result.
- Preferred explanation: “Each of the 32 filters is 12 × 3 × 3. At each position, it computes a weighted sum over the 3 × 3 window across all 12 input channels, producing one output value.” Substitute actual layer parameters.

### Batch normalization

- State once in a footnote that normalization is per channel, across batch and spatial positions during training.
- Slide 1: normalize without ε, γ, or β.
- Slide 2: add ε and explain division-by-zero avoidance and numerical stability.
- Slide 3: add learned γ and β; explain why fixed zero mean and unit variance can restrict representation.
- Slide 4: Training on the left, Inference on the right, with matching normalization formulas using `batch` and `run` statistics subscripts respectively.
- Show running-mean and running-variance updates during training with coefficients 0.97 and 0.03. State explicitly that running statistics are **not updated during inference**.
- Keep the display uncluttered: omit the `u` suffix and the unbiased-variance note. This is a presentation simplification; PyTorch's running-variance update uses the unbiased batch estimate, whereas training normalization uses the biased estimate.

### SiLU

- Slide 1: centered SiLU formula and function curve, without input/output boxes or a derivative tangent.
- Slide 2: the same curve with a moving tangent and slope label; show the chain rule and explain why gradients are needed to minimize L.
- Describe dL/dw as how changing **a weight w** affects the loss. SiLU's derivative is one multiplier in the chain rule.
- Explain that a continuous derivative avoids abrupt changes in that multiplier. Do not claim it guarantees strong gradients or better training.

### Elementwise add

- Show two small matrices, a plus sign, and their sum.
- Keep it static and minimal; no unnecessary animation or notes.

### Concatenate

- Animate feature-channel stacks from separate branches joining in order. Preserve values; concatenation is not elementwise addition.
- Label each branch's destination channel range using zero-based indices.
- For CSP, bottleneck-branch channels come first, followed by bypass-branch channels.
- For SPP, the order is unpooled X, pool5(X), pool9(X), pool13(X).
- Show dimensions as **(32+32) × 160 × 160 → 64 × 160 × 160**, adjusted to the actual inputs.
- Keep “Separate branches” and “Concatenated” close to their figures. Crop unused space above the figures.

### Max pooling

- Show the moving window on the input and fill the output one position at a time.
- Highlight the maximum value(s) in the current window and display **Current window’s max = …**.
- Show the actual kernel size, stride, and **−∞ padding** width. Padding cannot defeat valid negative values.
- State that pooling works independently per channel and has no learned weights.

## Source organization

- Work in `yolox-explorer/`. Leave the original standalone HTML and pre-refactor backup untouched.
- `index.html`: page and popup markup, plus ordered deferred script references.
- `styles.css`: presentation and layout.
- `architecture.js`: architecture hierarchy, operation parameters, and tensor shapes.
- `core.js`: shared state, DOM references, and SVG helpers.
- `diagram.js`: rendering, routing, alignment, camera behavior, and startup.
- `popups.js`: shared hover, focus, dismissal, and animation lifecycle.
- `animations/`: operation-specific popup rendering and animations.
- Use plain JavaScript and local assets. The editable version must open directly from `index.html` without a server or build step.
- Register new popups with the shared lifecycle, including dismissal, focus recovery, frame cancellation, selection, and scrolling behavior.
- Preserve deferred-script order: shared definitions first, popup implementations next, diagram startup last.
- Generate portable single-file exports with `node build-single-file.js`; do not edit `dist/` as the source of truth.
- Check changed scripts for syntax and validate operation-specific calculations or routing when those change. Distinguish code checks from actual browser verification.

## Detection heads

- The detailed head uses the COCO reference: K = 80 classes. The first head receives 128 × 80 × 80 features at stride 8.
- Show a shared stem followed by separate classification and regression branches. Objectness shares the regression features.
- Prediction convolutions have learned biases and no BatchNorm or SiLU. Convolution illustrations show the pre-bias contribution and state when a learned bias follows.
- Name these blocks Sigmoid. Their info popup explains the 0–1 curve and that the explicit activation is inference-only because BCEWithLogitsLoss incorporates it during training. Show sigmoid only on classification and objectness outputs. Box predictions do not use sigmoid.
- Assemble channels in box, objectness, class order. Flattening and coordinate decoding are subsequent steps, not implicit sigmoid operations.
- All three heads share the same diagram structure with independent parameters and IDs. Stems map 128, 256, or 512 input channels to 128 hidden channels. Route each neck scale to its own head input.

- Name the spatial scales Small-scale detection head (80 × 80), Medium-scale detection head (40 × 40), and Large-scale detection head (20 × 20). Center the middle head input so the outer input routes go up and down.
- Regression exposes two separate outputs, even while collapsed: box predictions (4 × H × W) and objectness (1 × H × W), using each head’s actual grid size. Assembly receives these separately from classification.
- Bottom-up has an animated info popup showing learned downsampling and retained top-down feature fusion.

- Detection head scale names refer to object size: the finer stride-8 grid serves small objects and the coarser stride-32 grid serves large objects.
- With Neck and Detection heads expanded but Bottom-up collapsed, outer outputs leave matching top/bottom points on the trapezoid, away from corners, around a straight middle output.

- The NMS popup compares per-class and class-agnostic modes side by side using identical candidates and a shared manual step control. Compute displayed IoUs from the drawn boxes. Keep drawings at the same size and show why a different-class box survives only in per-class mode.
