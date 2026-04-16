# Proposed Methodology: A Multimodal AI-Driven Framework for Real-Time Emergency Triage and Physiological Monitoring

## 1. Introduction
This section delineates the architectural and mathematical framework of **AidVision**, a proposed system for decentralized emergency medical assistance. The methodology integrates Large Multimodal Models (LMM), real-time Photoplethysmography (rPPG), and Geospatial intelligence to optimize the "Golden Hour" of trauma response.

---

## 2. System Architecture
The proposed methodology follows a three-layered hierarchical structure:
1.  **Perception Layer**: Utilizing mobile sensors for visual data capture (injury images) and temporal luminosity changes (cardiac signals).
2.  **Cognitive Synthesis Layer**: A Hybrid Neural Engine that fuses a **CNN (ResNet-50)** and **MLP** with a Local LLM (**Qwen2.5:0.5B**) to process visual/physiological data.
3.  **Response Orchestration Layer**: Generation of deterministic first-aid sequences, geospatial coordination, and emergency broadcasting.

---

## 3. Remote Physiological Signal Processing (rPPG Module)
The system implements a contactless heartbeat detection mechanism based on the volumetric changes in the microvascular tissue bed.

### 3.1. Signal Extraction
The algorithm isolates the **Red Channel** ($I_R$) from the RGB video stream at 30 frames per second (FPS), as blood reflects most of the red spectrum while green and blue light are absorbed. The spatial average of a central Region of Interest (ROI) is calculated to minimize periphery noise:
$$Y(t) = \frac{1}{|ROI|} \sum_{(x,y) \in ROI} I_R(x, y, t)$$

### 3.2. Signal Conditioning
To remove high-frequency sensor noise and DC drift, a dual-stage filter is applied.
1.  **Moving Average Filter**: 
    $$\bar{Y}(t) = \frac{1}{W} \sum_{i=0}^{W-1} Y(t-i)$$
    where $W=5$ (the window size).
2.  **Zero-Phase Butterworth Filter**: Applied within the clinical heart rate band [0.75 Hz, 3.3 Hz].

### 3.3. Feature Quantification Formulas
1.  **Heart Rate (HR) Estimation**:
    $$HR_{BPM} = \frac{60 \cdot f_s}{N} \sum_{i=1}^{N} \Delta P_i$$
    where $f_s$ is the sampling frequency and $\Delta P_i$ is the inter-peak interval in frames.
2.  **Heart Rate Variability (HRV)**: Measured using the Root Mean Square of Successive Differences (RMSSD) to quantify autonomic stress:
    $$RMSSD = \sqrt{\frac{1}{n-1} \sum_{i=1}^{n-1} (RR_{i+1} - RR_i)^2}$$
    where $RR_i$ is the time interval between successive heartbeat peaks.

---

## 4. Intelligent Triage & Severity Assessment (LMM Module)
The system utilizes a **Hybrid Qwen2.5:0.5B Inference Engine** (via Ollama) for medical reasoning.

### 4.1. Multimodal Context Aggregation
The input vector $\mathcal{X}$ is formulated as:
$$\mathcal{X} = \{I_{image}, A_{audio\_text}, P_{profile}, C_{history}\}$$
where $I$ is the surgical/injury image, $A$ is the transcribed voice symptom, $P$ is the demographic profile, and $C$ is the clinical context (allergies/medications).

### 4.2. Chain-of-Thought (CoT) Prompting
To ensure medical accuracy, the system employs deterministic prompting:
> "Analyze visual injury patterns $\mathcal{I}$ against severity indices $\mathcal{S}$. Generate step-wise intervention $\mathcal{G}$ such that $\mathcal{G} = \{s_1, s_2, ..., s_n\}$ with duration $\tau$ per step."

### 4.3. Deterministic Output Parsing
To prevent hallucinations, the model is constrained via **JSON Schema Enforcement**, ensuring that the software interface receives a parseable object for the Guidance UI.

---

## 5. Geospatial Coordination & Distance Optimization
The system identifies nearest medical facilities using the **Haversine Formula** to account for Earth's curvature.

### 5.1. Distance Calculation
For two points $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$, the great-circle distance $d$ is:
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}(\sqrt{a}, \sqrt{1-a})$$
$$d = R \cdot c$$
where $R = 6371$ km (Earth's radius).

---

## 6. Experimental Validation Methodology
### 6.1. Dataset Compilation
The model is validated against a dataset of 200 high-fidelity emergency scenarios. To ensure Generalization, the dataset includes:
- **Environmental Variance**: Multi-lux illumination levels (10 lux to 1000 lux).
- **Domain Mapping**: Synthetic samples statistically equivalent to **ISIC** and **MedPix** distributions.

### 6.2. Performance Metrics
Accuracy is not measured as a monolithic value; instead, we employ a **Risk-Weighted Accuracy (RWA)**:
$$RWA = \frac{1}{N} \sum_{i=1}^{N} \omega_i \cdot \delta_{ij}$$
where $\omega = -5.0$ if the model fails to identify a **Critical** severity (False Negative), and $\omega = 1.0$ for correct classifications.

### 6.3. Robustness Stress Testing
We perform a perturbation analysis where image quality is degraded via Gaussian noise ($\sigma$) and Motion Blur ($k$):
$$I_{perturbed} = (I * G_\sigma) \otimes B_k$$
Accuracy is then plotted against perturbation intensity to measure the **Model Trust Index**.

---

## 7. Ethical Governance and Privacy
1.  **Local-First Processing**: Bilbiometric rPPG estimation is performed in-browser using Typed Arrays to prevent biometric leakage.
2.  **Safety Guardrails**: A rule-based regex interceptor monitors the LMM input; if life-threatening keywords (e.g., "cardiac arrest") are detected, the system executes an **Emergency Bypass** to the SOS module, overriding the AI reasoning loop.

---

## 8. Conclusion
The proposed methodology offers a robust, mathematically validated framework for mobile emergency triage. By combining contactless vital monitoring with state-of-the-art LMM reasoning, AidVision provides a scalable solution to global emergency health accessibility.
