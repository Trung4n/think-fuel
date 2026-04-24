# UI/UX DESIGN SYSTEM: PROJECT "THINKFUEL"

## 1. DESIGN PHILOSOPHY

- **Core Style:** Surgical Minimalism x Cyber-Tech.
- **Vibe:** Professional, High-Efficiency, Deep Work, Data-Driven.
- **Layout:** **Bento Grid** system with sharp edges (4px - 6px radius) to maintain a disciplined and technical look.
- **Adaptive Theme:** Seamless Light/Dark mode support via a high-performance theme engine.

---

## 2. COLOR SYSTEM & TYPOGRAPHY

### 2.1. Adaptive Color Palette

- **Light Mode:** Background `#FAFAFA` with 3% opacity grid lines; Surface `#FFFFFF` with `#E5E7EB` borders.
- **Dark Mode:** Background `#050505` with 3% opacity grid lines; Surface `rgba(255,255,255,0.02)` with `rgba(255,255,255,0.08)` borders.
- **Brain Fuel Indicators (Dynamic Glow):**
  - **Optimal (> 700):** `#06B6D4` (Cyan) - Logical stability.
  - **Warning (300-700):** `#F59E0B` (Amber) - Attention required.
  - **Critical (< 300):** `#EA580C` (Orange) - Resource depletion.
  - **Locked (0):** `#E11D48` (Rose) - System standby.

### 2.2. Typography

- **Headings & Data:** `JetBrains Mono` (Technical precision).
- **Body:** `Inter` or `SF Pro Display` (Modern readability).

---

## 3. DETAILED INTERFACE STRUCTURE

### 3.1. Authentication Gateway (Split-Screen Login)

- **Left Panel:** Generative 3D Mesh visualization representing neural connectivity.
- **Right Panel:** Minimalist form with a **Role Switcher** (Student/Teacher tabs) and floating label inputs for a clean entry experience.

### 3.2. Student Dashboard: The Intelligence Hub

- **Widget 01: The Core (Fuel Meter):** A holographic energy ring representing the current Brain Fuel status.
- **Widget 02: Dependency Radar:** A HUD-style spider chart showing "Independent Thinking" levels across different subjects.
- **Widget 03: Cognitive Heatmap:** A GitHub-style contribution graph tracking independent learning frequency.
- **Widget 04: Personalized Learning Roadmap (THE ANALYSIS ENGINE):**
  - **UI Style:** Interactive Node-Link diagram (Knowledge Graph).
  - **Logic Integration:** Each node is generated based on **History, Test Results, and Personal Goals**.
  - **Metadata Tags:** Nodes display reasoning such as `[REASON: TEST_FAILURE_GAP]` or `[REASON: STYLE_ADAPTATION]`.
  - **Dynamic Flow:** The path updates in real-time. If fuel is low, the roadmap injects "Refuel Nodes" (independent practice tasks) before unlocking new content.

### 3.3. AI Terminal: Socratic Assistant

- **UI:** No-bubble Command Line Interface.
- **Behavior:** AI profile picture is replaced by a **Waveform Indicator**.
- **Constraint:** When fuel is low, the system blocks direct answers and forces Socratic questioning (e.g., "What have you tried so far?").

### 3.4. Adaptive Quiz: Focus Environment

- **Design:** Zero-distraction UI with massive negative space.
- **Adaptive Logic:** Difficulty levels adjust dynamically based on real-time performance.
- **Feedback:** Correct answers trigger a "Data Decrypted" terminal animation to recharge Brain Fuel.

### 3.5. Teacher Command Center: Data Observatory

- **Class Treemap:** Visualizes the entire class's "Brainrot" vs. "Independence" status.
- **Risk Alert Panel:** Real-time identification of students falling behind or over-relying on AI.
- **Student Data Matrix:** High-density table showing progress, scores, and learning habits.

---

## 4. ANIMATION & INTERACTION

- **Theme Transition:** 300ms ease-in-out radial wipe.
- **Micro-interactions:** Spring-based physics on card hovers and button clicks for a premium feel.
