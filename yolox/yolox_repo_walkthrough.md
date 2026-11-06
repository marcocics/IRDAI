# Guide to the YOLOX repository

The official [Megvii-BaseDetection/YOLOX repository](https://github.com/Megvii-BaseDetection/YOLOX) contains a PyTorch object detector, training and evaluation tools, deployment examples, and documentation. This guide explains how those components fit together and where to make common changes. Links reference the `main` branch; reproducible experiments should record the exact commit used.

## Repository overview

```text
YOLOX/
├── .github/workflows/
├── assets/
├── datasets/
├── demo/
├── docs/
├── exps/
├── tests/
├── tools/
├── yolox/
├── .gitignore
├── .pre-commit-config.yaml
├── .readthedocs.yaml
├── LICENSE
├── MANIFEST.in
├── README.md
├── SECURITY.md
├── hubconf.py
├── requirements.txt
├── setup.cfg
└── setup.py
```

The repository separates task entry points, experiment configurations, and the implementation. Scripts in `tools/` launch tasks, files in `exps/` configure them, and the `yolox/` package performs the work. Datasets, supporting images, and documentation occupy separate folders.

| Resource or entry point | Supporting implementation | Relationship |
|---|---|---|
| `datasets/` | `yolox/data/` | Images and annotations are read and transformed by the data pipeline. |
| `exps/` | `yolox/exp/` | Specific configurations inherit experiment defaults and construction methods. |
| `tools/` | `yolox/core/`, `models/`, and other modules | Command scripts call the implementation to execute a task. |

For example, `tools/train.py` loads an experiment from `exps/`. The experiment constructs the model and data loader, while `yolox/core/trainer.py` coordinates training using `yolox/data/` and `yolox/models/`.

## 1. `.github/workflows/`: automated GitHub checks

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/.github/workflows)

```text
.github/workflows/
├── ci.yaml
└── format_check.sh
```

`ci.yaml` defines a GitHub Actions workflow called CI, meaning Continuous Integration. It runs on pushes and pull requests[^pull-request], with no branch restriction in the configuration.

It runs jobs on Ubuntu 22.04 with Python 3.8, 3.9, and 3.10. This list is a **matrix**: the same steps run separately for each Python version. Each job checks out the repository, installs dependencies and checking tools, and runs `format_check.sh`.

`format_check.sh` runs:

```bash
flake8 yolox exps tools
isort --check-only -rc yolox exps
```

- `flake8` checks style and common programming problems, such as unused imports and undefined names.
- `isort` checks import ordering. `--check-only` means it reports problems without changing files.
- A failure makes the script and GitHub check fail.

These checks help maintainers review incoming changes for code quality. The workflow runs formatting checks; software behavior tests are provided separately in `tests/`. Cloning the repository triggers neither. The shell script can also be run locally after installing its dependencies in a suitable Bash environment.

## 2. `assets/`: supporting images

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/assets)

```text
assets/
├── assignment.png
├── demo.png
├── dog.jpg
├── git_fig.png
├── logo.png
└── sunjian.png
```

These are images used in documentation and examples. For instance, `dog.jpg` is the default input image in `tools/demo.py`. There is no executable code here.

## 3. `datasets/`: images and annotations

[Folder and instructions](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/datasets)

The repository includes a `README.md` here; datasets must be downloaded separately.

The default COCO layout is:

```text
datasets/
└── COCO/
    ├── annotations/
    │   ├── instances_train2017.json
    │   └── instances_val2017.json
    ├── train2017/
    │   └── training images
    └── val2017/
        └── validation images
```

The JSON annotations identify images and describe their objects, classes, and bounding boxes.

You can set `YOLOX_DATADIR` to another dataset root. With the default COCO configuration, YOLOX looks for `COCO/` beneath that root. An experiment can also set an explicit `data_dir`.

The suffix `2017` identifies the COCO release. Its training split contains approximately 118,000 images and its validation split contains 5,000. Validation measures predictions against known ground truth during development. Inference on individual images through `tools/demo.py` requires neither annotations nor this directory layout.

The default COCO loading setup expects the structure above. Experiment settings can change the dataset root and annotation filenames. Changing image-directory names requires customizing dataset construction; a different annotation format may require another dataset reader. Setting the number of classes alone does not change how files are located.

Custom datasets can retain the `2017` names as a directory convention, regardless of when their images were collected. A two-class configuration is illustrated in the experiment section below.

## 4. `demo/`: deployment examples

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/demo)

```text
demo/
├── MegEngine/
├── ONNXRuntime/
├── OpenVINO/
├── TensorRT/
├── ncnn/
└── nebullvm/
```

These examples run a trained detector with different inference frameworks or deployment tooling.

Deployment requires both the learned weights and the network's operations and connections. Exporting or conversion produces a representation the target framework can execute.

```text
Trained model → conversion → target runtime → detections
```

### ONNX Runtime example

ONNX export produces an `.onnx` file containing the computation graph and weights. The ONNX Runtime example loads it, prepares an image, runs inference, and processes predictions into detections. This conversion requires no retraining.

### TensorRT example

TensorRT conversion produces an execution engine optimized for NVIDIA GPUs. The folder provides Python and C++ examples for efficient inference on that hardware. Numerical precision and conversion can introduce small differences in predictions.

The surrounding demo code handles preprocessing, interpreting outputs, and displaying detections. For ordinary PyTorch inference, use `tools/demo.py`.

## 5. `docs/`: documentation and website source

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/docs)

The published [YOLOX documentation website](https://yolox.readthedocs.io/) is built from this folder. Its address is listed in the GitHub repository's About section. Reading the published site requires no local build.

### Guides

| File | Purpose |
|---|---|
| `quick_run.md` | Installation and commands for running, training, and evaluating YOLOX. |
| `train_custom_data.md` | Custom datasets and experiment files. |
| `model_zoo.md` | Model variants, results, and pretrained weights. |
| `cache.md` | RAM or disk image caching, including custom dataset support. |
| `freeze_module.md` | Keeping selected network modules fixed during training. |
| `manipulate_training_image_size.md` | Training/evaluation resolutions and multiscale training. |
| `assignment_visualization.md` | Visualizing matches between prediction locations and ground-truth objects. |
| `mlflow_integration.md` | Tracking parameters, metrics, and artifacts with MLflow; optional Databricks integration. |
| `updates_note.md` | Historical changes, optimizations, and compatibility notes. |

### Website build files and folders

The documentation uses **Sphinx**, which converts documentation source into pages.

| File or folder | Purpose |
|---|---|
| `index.rst` | Homepage and table of contents. |
| `conf.py` | Sphinx theme, extensions, Markdown support, and build settings. |
| `Makefile` | Documentation build shortcuts, such as `make html`. |
| `requirements-doc.txt` | Dependencies for building the documentation. |
| `.gitignore` | Ignores generated `_build/` output. |
| `_static/` | Static website resources. |
| `_static/css/` | Stylesheet directory. |
| `_static/css/custom.css` | Custom website styling. |

### `docs/demo/`

These are symbolic links to deployment READMEs under the top-level `demo/`, allowing the website to reuse them:

| File | Referenced guide |
|---|---|
| `megengine_cpp_readme.md` | MegEngine C++. |
| `megengine_py_readme.md` | MegEngine Python. |
| `ncnn_android_readme.md` | ncnn Android. |
| `ncnn_cpp_readme.md` | ncnn C++. |
| `onnx_readme.md` | ONNX export and ONNX Runtime. |
| `openvino_cpp_readme.md` | OpenVINO C++. |
| `openvino_py_readme.md` | OpenVINO Python. |
| `trt_cpp_readme.md` | TensorRT C++. |
| `trt_py_readme.md` | TensorRT Python. |

## 6. `exps/`: experiment configurations

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/exps)

```text
exps/
├── default/
└── example/
```

- `default/`: standard model configurations, such as YOLOX-S, M, L, and X.
- `example/`: examples of customization, including custom datasets.

An experiment file is Python code configuring the model, data, and training. It inherits defaults and changes what is needed.

For instance, `exps/default/yolox_s.py` sets:

```python
self.depth = 0.33
self.width = 0.50
```

These multipliers control network depth and channel counts. Other settings are inherited from the base experiment.

Select a file using `-f`:

```bash
python tools/train.py -f exps/default/yolox_s.py
```

An experiment file contains configuration and construction logic, not the actual dataset or trained weights.

### Experiment customization

Experiment files are the main extension point for high-level work. They configure model size, class count, dataset locations, input resolution, augmentation, optimizer, learning rate, and training duration. Overriding construction methods also allows changes such as freezing selected modules in `get_model()`.

An experiment inherits the base implementation from `yolox/exp/` and overrides only the relevant settings or methods. Changes to the underlying network blocks, matching algorithm, or loss implementation generally belong in `yolox/`.

### Two-class dataset configuration

For a dataset with two classes, prepare COCO-format training and validation annotations with the same category definitions in both splits. Place them under `datasets/my_dataset/` using the layout described in the dataset section.

Copy `exps/example/custom/yolox_s.py` to `exps/example/custom/my_two_classes.py` and set:

```python
self.data_dir = "datasets/my_dataset"
self.train_ann = "instances_train2017.json"
self.val_ann = "instances_val2017.json"
self.num_classes = 2
```

With the environment and dataset prepared, an example training command is:

```bash
python tools/train.py -f exps/example/custom/my_two_classes.py -d 1 -b 8
```

`-f` selects the experiment, `-d 1` selects one GPU, and `-b 8` sets the batch size. The model construction code uses `num_classes` to create a two-class detection head.

[Custom training guide](https://github.com/Megvii-BaseDetection/YOLOX/blob/main/docs/train_custom_data.md)

## 7. `tests/`: software behavior tests

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/tests)

```text
tests/
├── __init__.py
└── utils/
    └── test_model_utils.py
```

`test_model_utils.py` tests helpers for training/evaluation modes and module freezing. For example, it checks that temporarily entering evaluation mode restores the previous module modes afterward.

A simplified illustration:

```python
model.train()

with adjust_status(model, training=False):
    assert model.training is False

assert model.training is True
```

`assert` means that a condition must be true. If it is false, the check fails.

After installing YOLOX and its dependencies, you can run the tests from the repository root:

```bash
python -m unittest discover -s tests/utils -p "test_*.py"
```

The tests construct the objects they need and require no previously trained model. They check software behavior rather than detection accuracy. They can run locally or be invoked by a CI workflow; the repository's workflow described above currently runs formatting checks instead.

## 8. `tools/`: commands you launch

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/tools)

| File | Purpose |
|---|---|
| `train.py` | Start training using an experiment configuration. |
| `eval.py` | Measure detection performance on an annotated dataset. |
| `demo.py` | Run PyTorch detection on images, video, or a webcam and display results. |
| `export_onnx.py` | Export a trained model to ONNX. |
| `export_torchscript.py` | Export a trained model to TorchScript. |
| `trt.py` | Convert a trained model for TensorRT deployment on NVIDIA GPUs. |
| `visualize_assign.py` | Display prediction-to-ground-truth assignment. |
| `__init__.py` | Initializes the Python package. |

The export/conversion scripts prepare trained models for deployment. They do not train new weights.

## 9. `yolox/`: the implementation

[Folder](https://github.com/Megvii-BaseDetection/YOLOX/tree/main/yolox)

This is the main Python package. The top-level command scripts call its implementation.

### `core/`: training execution

- `launch.py`: launches processes, including distributed training across GPUs.
- `trainer.py`: manages the training loop, optimization steps, evaluation, logging, and checkpoints.
- `__init__.py`: package initialization and exports.

The essential iteration is:

```text
Fetch batch → preprocess → model → loss → backward → optimizer step
```

The trainer also updates the learning rate and, when enabled, the moving average of model weights.

### `data/`: input preparation

- `datasets/`: dataset readers and wrappers, including Mosaic support.
- `data_augment.py`: resizing, padding, flipping, color changes, and other transforms.
- `dataloading.py`: data-loading and batching support.
- `samplers.py`: selects and groups dataset items.
- `data_prefetcher.py`: prepares/transfers upcoming batches to the GPU.
- `__init__.py`: package initialization and exports.

The default inference preprocessing preserves OpenCV's BGR channel order, resizes and pads the image, converts it to channel-first floating-point data, and does not divide by 255. Legacy preprocessing differs.

### `evaluators/`: detection performance

- `coco_evaluator.py`: COCO evaluation.
- `voc_evaluator.py`: Pascal VOC evaluation pipeline.
- `voc_eval.py`: supporting VOC metric calculations.
- `__init__.py`: package initialization and exports.

Evaluators compare predicted classes and boxes with ground truth and calculate metrics such as average precision.

### `exp/`: experiment machinery

- `base_exp.py`: base experiment interface.
- `yolox_base.py`: default settings and construction of models, data loaders, optimizers, schedulers, and evaluators.
- `build.py`: loads an experiment by path or model name.
- `default/`: package location for standard experiment definitions.
- `__init__.py`: package initialization and exports.

Useful experiment methods include `get_model()`, `get_dataset()`, `get_data_loader()`, `get_optimizer()`, `get_lr_scheduler()`, and `get_evaluator()`.

### `layers/`: accelerated evaluation support

- `cocoeval/`: compiled COCO evaluation code.
- `fast_coco_eval_api.py`: Python interface to the accelerated implementation.
- `jit_ops.py`: compilation/loading support for extensions.
- `__init__.py`: package initialization and exports.

Despite its name, this folder mainly supports evaluation; convolution and CSP building blocks are in `models/`.

### `models/`: network definition

| File | Purpose |
|---|---|
| `network_blocks.py` | BaseConv, Focus, bottlenecks, CSP layers, SPP, and other reusable blocks. |
| `darknet.py` | Darknet and CSPDarknet backbones. |
| `yolo_pafpn.py` | CSPDarknet plus the PAFPN neck[^pafpn] used by standard variants. |
| `yolo_fpn.py` | Alternative feature pyramid used by the Darknet53 variant. |
| `yolo_head.py` | Box, objectness, and class predictions; SimOTA assignment[^simota] and loss calculation. |
| `losses.py` | IoU-based box loss. |
| `yolox.py` | Connects feature extraction and the detection head. |
| `build.py` | Model construction/loading helpers. |
| `__init__.py` | Package initialization and exports. |

In `YOLOX.forward()`, the image passes through `self.backbone`, then `self.head`. During training, the model returns losses; during evaluation, it returns predictions. Confidence filtering and NMS happen in postprocessing.

The attribute `self.backbone` normally holds `YOLOPAFPN`, which includes both CSPDarknet and the neck.

For YOLOX-S with a 640 × 640 input, CSPDarknet supplies these features to the neck:

| Source | Channels × height × width | Stride |
|---|---|---|
| `dark3` | 128 × 80 × 80 | 8 |
| `dark4` | 256 × 40 × 40 | 16 |
| `dark5` | 512 × 20 × 20 | 32 |

The neck produces fused features at those three spatial resolutions. For COCO, each head location predicts 4 box values, 1 objectness value, and 80 class scores. There are `80×80 + 40×40 + 20×20 = 8,400` candidate locations.

### `tools/`: installed-package access

The source folder contains `__init__.py`. Packaging maps the top-level `tools/` scripts to `yolox.tools`; this is not a second implementation of the tools.

### `utils/`: shared helpers

| File | Purpose |
|---|---|
| `boxes.py` | Box conversions, overlap calculations, and prediction postprocessing. |
| `checkpoint.py` | Save and load checkpoints. |
| `lr_scheduler.py` | Learning-rate schedules. |
| `ema.py` | Moving average of model weights. |
| `visualize.py` | Detection and assignment drawings. |
| `logger.py` | Logging support. |
| `mlflow_logger.py` | MLflow experiment logging. |
| `dist.py` | Distributed execution helpers. |
| `allreduce_norm.py` | Distributed synchronization of normalization statistics. |
| `model_utils.py` | Model inspection, freezing, fusion, and mode helpers. |
| `metric.py` | Tracking and summarizing measurements. |
| `demo_utils.py` | Deployment/demo helpers. |
| `compat.py` | Compatibility helpers. |
| `setup_env.py` | Runtime environment setup. |
| `__init__.py` | Package initialization and exports. |

## 10. Root files

### `.gitignore`

Tells Git which untracked local files to ignore. Examples include datasets, training outputs, model weights, exported models, Python caches, virtual environments, and editor settings.

It does not delete files or prevent their creation. Files already tracked by Git remain tracked even if they match an ignore rule.

### `.pre-commit-config.yaml`

Configures local checks that can run before a Git commit once the pre-commit hooks are installed. Downloading the repository alone does not activate them.

### `.readthedocs.yaml`

Tells Read the Docs how to build the documentation website and PDF, using `docs/conf.py` and the specified dependencies.

### `LICENSE`

Contains the Apache 2.0 license governing use and distribution of the project.

### `MANIFEST.in`

Specifies extra files for source packaging, including `requirements.txt` and C++/CUDA source and header files.

### `README.md`

The main introduction displayed on GitHub: project description, installation, model results, usage examples, and links.

### `SECURITY.md`

Instructions for reporting security vulnerabilities.

### `hubconf.py`

Exposes models through PyTorch Hub, for example:

```python
import torch
model = torch.hub.load("Megvii-BaseDetection/YOLOX", "yolox_s")
```

### `requirements.txt`

Lists the Python libraries YOLOX depends on.

### `setup.cfg`

In this repository, it configures `flake8` and `isort`. It specifies rules such as a 100-character line limit and import grouping/order. The checking tools read it when they run; it does not configure training.

### `setup.py`

Defines package installation information: name, version, Python modules, dependencies, and compiled evaluation extensions.

From the repository root:

```bash
pip install -e .
```

- `.` means the current directory.
- `-e` requests an editable installation, so ordinary Python source edits are reflected without reinstalling. Changes to compiled extensions or packaging metadata can require rebuilding or reinstalling.

It also maps:

```text
tools/        → yolox.tools
exps/default/ → yolox.exp.default
```

`setup.py` is a conventional filename recognized by Python packaging tools such as setuptools and pip. Python itself does not automatically run it. Modern projects commonly use `pyproject.toml`; YOLOX uses the older `setup.py` approach.

## Suggested source-reading path

The following order follows inference first, then training and evaluation:

1. `tools/demo.py`: a complete inference pipeline.
2. `yolox/exp/yolox_base.py`: defaults and component construction.
3. `yolox/models/yolox.py`: overall network connections.
4. `yolo_pafpn.py`, `darknet.py`, `network_blocks.py`: feature extraction and fusion.
5. `yolo_head.py`: prediction, then training assignment and losses.
6. `tools/train.py` and `yolox/core/trainer.py`: training execution.
7. `yolox/data/` and `yolox/evaluators/`: data preparation and performance measurement.

[^pull-request]: A pull request proposes merging changes into a repository. A contributor can create a fork (a personal repository copy), commit changes on a branch, and submit them for review. Maintainers discuss the changes, review automated checks, and decide whether to merge them.

[^pafpn]: **Path Aggregation Feature Pyramid Network.** The neck combines features at several resolutions through a top-down pass (upsampling coarse features and fusing them with finer features) and a bottom-up pass (downsampling fused fine features and combining them with coarser features). This brings spatial detail and broader context together before detection.

[^simota]: **Simplified Optimal Transport Assignment.** During training, SimOTA selects which candidate predictions learn from each ground-truth object using classification information, box overlap, and spatial constraints. An object can be matched to multiple predictions. This target-assignment procedure is not used during inference.
