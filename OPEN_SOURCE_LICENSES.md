# NOL-IS Smart Operations Suite — Third-Party Open Source Licenses & Notices

This platform and its standalone subprojects (AI-TMO, LWO, PVO) incorporate and depend on open-source software libraries.
We gratefully acknowledge the original authors and maintainers for their generous contributions to the software community.

---

## Table of Contents
1. [Core Multimedia Framework](#1-core-multimedia-framework)
2. [Computer Vision & AI Models](#2-computer-vision--ai-models)
3. [Python Backend & Data Processing](#3-python-backend--data-processing)
4. [Frontend & Mobile Frameworks](#4-frontend--mobile-frameworks)
5. [Typography & Web Fonts](#5-typography--web-fonts)
6. [Complete Open Source License Texts](#6-complete-open-source-license-texts)

---

## 1. Core Multimedia Framework

### FFmpeg
- **License**: GNU Lesser General Public License v3.0 (LGPLv3) / GNU General Public License v3.0 (GPLv3)
- **Copyright**: © 2000-2026 Fabrice Bellard and the FFmpeg developers
- **Website**: https://ffmpeg.org
- **Integration**: Invoked solely as an independent external command-line process via OS subprocess execution. No dynamic or static linking into application binaries.
- **Source Code Availability**:
  - Official Website: https://ffmpeg.org
  - Source Code Releases: https://ffmpeg.org/download.html
  - GNU LGPL v3: https://www.gnu.org/licenses/lgpl-3.0.html

### Cisco OpenH264
- **License**: BSD 2-Clause License
- **Copyright**: © 2013-2026 Cisco Systems, Inc.
- **Website**: https://github.com/cisco/openh264
- **Role**: High-performance, royalty-free H.264 video encoding integrated into LGPL FFmpeg distributions.

---

## 2. Computer Vision & AI Models

### OpenCV (Open Source Computer Vision Library)
- **License**: Apache License 2.0
- **Copyright**: © 2000-2026 Intel Corporation, Willow Garage Inc., Itseez Inc., OpenCV Foundation and contributors
- **Website**: https://opencv.org

### YuNet Face Detection Model (`face_detection_yunet_2023mar.onnx`)
- **License**: Apache License 2.0
- **Copyright**: © 2021-2026 Shiqi Yu, OpenCV Zoo Contributors
- **Repository**: https://github.com/opencv/opencv_zoo/tree/master/models/face_detection_yunet
- **Role**: Onnx-based real-time deep learning facial detection used for local privacy face mosaic.

---

## 3. Python Backend & Data Processing

### FastAPI
- **License**: MIT License
- **Copyright**: © 2018-2026 Sebastián Ramírez
- **Website**: https://fastapi.tiangolo.com

### Uvicorn & Starlette
- **License**: BSD 3-Clause License
- **Copyright**: © 2017-2026 Encode OSS Ltd.
- **Website**: https://www.uvicorn.org / https://www.starlette.io

### Pydantic & Pydantic-Settings
- **License**: MIT License
- **Copyright**: © 2017-2026 Samuel Colvin
- **Website**: https://docs.pydantic.dev

### NumPy
- **License**: BSD 3-Clause License
- **Copyright**: © 2005-2026 NumPy Developers
- **Website**: https://numpy.org

### Pandas
- **License**: BSD 3-Clause License
- **Copyright**: © 2008-2026 AQR Capital Management, LLC, Lambda Foundry, Inc. and PyData Development Team
- **Website**: https://pandas.pydata.org

### OpenPyXL
- **License**: MIT License
- **Copyright**: © 2010-2026 Eric Gazoni, Charlie Clark
- **Website**: https://openpyxl.readthedocs.io

### Pillow (PIL Fork)
- **License**: HPND License (Historical Permission Notice and Disclaimer)
- **Copyright**: © 2010-2026 Jeffrey A. Clark and contributors; © 1997-2011 Secret Labs AB; © 1995-2011 Fredrik Lundh
- **Website**: https://python-pillow.org

### HTTPX
- **License**: BSD 3-Clause License
- **Copyright**: © 2019-2026 Encode OSS Ltd.
- **Website**: https://www.encode.io/httpx/

### OpenAI Python SDK
- **License**: Apache License 2.0
- **Copyright**: © 2023-2026 OpenAI
- **Website**: https://github.com/openai/openai-python

### Python-Multipart
- **License**: Apache License 2.0
- **Copyright**: © 2015-2026 Andrew Chen Wang
- **Website**: https://github.com/Kludex/python-multipart

### Python-Dotenv
- **License**: BSD 3-Clause License
- **Copyright**: © 2014-2026 Saurabh Kumar
- **Website**: https://github.com/theskumar/python-dotenv

### ImageIO-FFmpeg
- **License**: BSD 2-Clause License
- **Copyright**: © 2019-2026 Almar Klein
- **Website**: https://github.com/imageio/imageio-ffmpeg

---

## 4. Frontend & Mobile Frameworks

### React & React-DOM
- **License**: MIT License
- **Copyright**: © Meta Platforms, Inc. and affiliates
- **Website**: https://react.dev

### Apache ECharts & ECharts-for-React
- **License**: Apache License 2.0 (ECharts) / MIT License (echarts-for-react)
- **Copyright**: © 2017-2026 The Apache Software Foundation; © 2017 hustcc
- **Website**: https://echarts.apache.org

### Lucide Icons
- **License**: ISC License
- **Copyright**: © 2022-2026 Lucide Contributors
- **Website**: https://lucide.dev

### Ionic Capacitor (Core, Android, Filesystem, Share)
- **License**: MIT License
- **Copyright**: © 2017-2026 Drifty Co. / Ionic
- **Website**: https://capacitorjs.com

### ExcelJS
- **License**: MIT License
- **Copyright**: © 2014-2026 Guyon Roche
- **Website**: https://github.com/exceljs/exceljs

### FileSaver.js
- **License**: MIT License
- **Copyright**: © 2016 Eli Grey
- **Website**: https://github.com/eligrey/FileSaver.js

### Tailwind CSS, clsx, tailwind-merge
- **License**: MIT License
- **Copyright**: © 2017-2026 Tailwind Labs, Inc.; © 2018-2026 Luke Edwards; © 2021-2026 Dany Castillo
- **Website**: https://tailwindcss.com

### Electron
- **License**: MIT License
- **Copyright**: © 2013-2026 OpenJS Foundation and Electron contributors
- **Website**: https://www.electronjs.org

---

## 5. Typography & Web Fonts

### Pretendard
- **License**: SIL Open Font License 1.1
- **Copyright**: © 2021-2026 Kil Hyung-jin (Orion Cactus)
- **Website**: https://github.com/orioncactus/pretendard

### JetBrains Mono
- **License**: SIL Open Font License 1.1
- **Copyright**: © 2020 JetBrains s.r.o.
- **Website**: https://www.jetbrains.com/lp/mono/

### Inter
- **License**: SIL Open Font License 1.1
- **Copyright**: © 2016-2026 Rasmus Andersson
- **Website**: https://rsms.me/inter/

---

## 6. Complete Open Source License Texts

### The MIT License
```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache License, Version 2.0
```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### The 3-Clause BSD License
```
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### The 2-Clause BSD License (Cisco OpenH264, ImageIO-FFmpeg)
```
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### ISC License (Lucide Icons)
```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### SIL Open Font License (OFL-1.1)
```
PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide development
of collaborative font projects, to support the font creation efforts of academic
and linguistic communities, and to provide a free and open framework in which
fonts may be shared and improved in partnership with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The fonts,
including any derivative works, can be bundled, embedded, redistributed and/or
sold with any software provided that any reserved names are not used by
derivative works. The fonts and derivatives, however, cannot be released under
any other type of license. The requirement for fonts to remain under this
license does not apply to any document created using the fonts or their
derivatives.
```
