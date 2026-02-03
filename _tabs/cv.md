---
layout: page
title: CV
icon: fas fa-user-graduate
order: 3
---

<div class="cv-page">
  <div class="cv-header">
    <div class="cv-title-section">
      <h1 class="cv-name">{{ site.social.name | default: site.title }}</h1>
      <p class="cv-role">Ph.D. Student in Materials Science & Engineering</p>
      <p class="cv-focus">AI4Materials · Computational Discovery</p>
    </div>
    <a href="/assets/cv.pdf" target="_blank" class="cv-download-btn">
      <i class="fas fa-download"></i>
      Download PDF
    </a>
  </div>

  <section class="cv-section">
    <h2 class="cv-section-title"><i class="fas fa-graduation-cap"></i> Education</h2>
    <ul class="timeline-list">
      <li class="timeline-item">
        <div class="timeline-item-title">Seoul National University</div>
        <p class="timeline-degree">Ph.D. in Materials Science and Engineering</p>
        <span class="timeline-meta">Mar. 2026 – Present · Republic of Korea</span>
        <p class="timeline-text detail">Advised by <a href="https://scholar.google.com/citations?user=DYhDLrAAAAAJ&hl=ko" target="_blank">Seungwoo Han</a></p>
      </li>
      <li class="timeline-item">
        <div class="timeline-item-title">Imperial College London</div>
        <p class="timeline-degree">MEng in Materials Science and Engineering</p>
        <span class="timeline-meta">Sep. 2018 – Sep. 2022 · United Kingdom</span>
        <p class="timeline-text detail">Advised by <a href="https://scholar.google.co.uk/citations?user=Ktvn91gAAAAJ&hl=en" target="_blank">Aron Walsh</a></p>
      </li>
      <li class="timeline-item">
        <div class="timeline-item-title">North London Collegiate School Jeju</div>
        <p class="timeline-degree">International Baccalaureate Diploma Programme</p>
        <span class="timeline-meta">Sep. 2016 – Jul. 2018 · Republic of Korea</span>
      </li>
    </ul>
  </section>

  <section class="cv-section">
    <h2 class="cv-section-title"><i class="fas fa-briefcase"></i> Work Experience</h2>
    <ul class="timeline-list">
      <li class="timeline-item">
        <div class="timeline-item-title">E8IGHT Co., Ltd.</div>
        <p class="timeline-degree">Assistant Research Engineer</p>
        <span class="timeline-meta">Mar. 2023 – Mar. 2026 · Republic of Korea</span>
      </li>
      <li class="timeline-item">
        <div class="timeline-item-title">Lightvision Co., Ltd</div>
        <p class="timeline-degree">Assistant Research Engineer</p>
        <span class="timeline-meta">Jan. 2023 – Mar. 2023 · Republic of Korea</span>
      </li>
      <li class="timeline-item">
        <div class="timeline-item-title">Korea Electronics Technology Institute (KETI)</div>
        <p class="timeline-degree">Research Engineer Intern, SW R&D Department</p>
        <span class="timeline-meta">Oct. 2020 – Oct. 2021 · Republic of Korea</span>
      </li>
    </ul>
  </section>

  <section class="cv-section cv-section--flat">
    <h2 class="cv-section-title"><i class="fas fa-rocket"></i> Research Projects</h2>
    <div class="projects-list">
      <div class="project-item">
        <div class="project-summary" tabindex="0" role="button" aria-expanded="false">
          <div class="project-summary-content">
            <span class="project-title">Real-Time Fetal Monitor Tracking System</span>
            <p class="project-meta">Personal Project</p>
          </div>
          <div class="project-summary-right">
            <a href="" target="_blank" class="project-github-link" title="View on GitHub">
              <i class="fab fa-github"></i>
            </a>
            <span class="project-date">Jan. 2023 – Feb. 2023</span>
          </div>
          <i class="fas fa-chevron-down project-chevron"></i>
        </div>
        <div class="project-details">
          <div class="project-detail-section">
            <span class="project-detail-heading">Outcome</span>
            <p>Achieved real-time fetal monitor tracking at 30 fps using a mobile camera.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">What I did</span>
            <p>Developed a YOLOv4-based object detection system and optimized the data pipeline with OpenCV and TensorFlow for real-time inference.</p>
          </div>
          <div class="project-tags">
            <span class="project-tag">YOLOv4</span>
            <span class="project-tag">OpenCV</span>
            <span class="project-tag">TensorFlow</span>
            <span class="project-tag">Real-time Processing</span>
            <span class="project-tag">Python</span>
          </div>
        </div>
      </div>
      <div class="project-item">
        <div class="project-summary" tabindex="0" role="button" aria-expanded="false">
          <div class="project-summary-content">
            <span class="project-title">Machine Learning Prediction of Point Defect Properties</span>
            <p class="project-meta">Imperial College London · MEng Thesis · First Class (Top Honours)</p>
          </div>
          <div class="project-summary-right">
            <a href="/assets/WonjunChoi_MEng_Thesis.pdf" target="_blank" class="project-pdf-link" title="View Thesis PDF">
              <i class="fas fa-file-pdf"></i>
            </a>
            <a href="https://github.com/wonjunchoii/Evo_prediction_ml" target="_blank" class="project-github-link" title="View on GitHub">
              <i class="fab fa-github"></i>
            </a>
            <span class="project-date">Sep. 2021 – Jul. 2022</span>
          </div>
          <i class="fas fa-chevron-down project-chevron"></i>
        </div>
        <div class="project-details">
          <div class="project-detail-section">
            <span class="project-detail-heading">Outcome</span>
            <p>Achieved strong predictive performance for point defect properties in metal oxides using tree-based machine learning models.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">What I did</span>
            <p>Built Random Forest and Gradient Boosting models trained on DFT-generated defect datasets. Engineered descriptors using Matminer and PyMatGen, and optimized model performance by benchmarking feature selection methods.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">Supervision</span>
            <p><a href="https://scholar.google.co.uk/citations?user=Ktvn91gAAAAJ&hl=en" target="_blank">Prof. Aron Walsh</a> and <a href="https://scholar.google.com/citations?user=nVJFXWwAAAAJ&hl=en" target="_blank">Prof. Alex Ganose</a></p>
          </div>
          <div class="project-tags">
            <span class="project-tag">Python</span>
            <span class="project-tag">Random Forest</span>
            <span class="project-tag">Gradient Boosting</span>
            <span class="project-tag">DFT</span>
            <span class="project-tag">Feature Engineering</span>
            <span class="project-tag">Matminer</span>
            <span class="project-tag">PyMatGen</span>
          </div>
        </div>
      </div>
      <div class="project-item">
        <div class="project-summary" tabindex="0" role="button" aria-expanded="false">
          <div class="project-summary-content">
            <span class="project-title">Heat–Mass Transfer Simulation (Exhaust Pipe Scenario)</span>
            <p class="project-meta">Imperial College London · Modelling Project · First Class (Top Honours)</p>
          </div>
          <div class="project-summary-right">
            <a href="https://github.com/wonjunchoii/catalytic_converter_heatflow" target="_blank" class="project-github-link" title="View on GitHub">
              <i class="fab fa-github"></i>
            </a>
            <span class="project-date">Jan. 2020 – Mar. 2020</span>
          </div>
          <i class="fas fa-chevron-down project-chevron"></i>
        </div>
        <div class="project-details">
          <div class="project-detail-section">
            <span class="project-detail-heading">Outcome</span>
            <p>Accurately simulated heat flow in a discretized catalytic converter under exhaust pipe operating conditions.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">What I did</span>
            <p>Solved numerical heat transfer equations on a discretized geometry to model temperature evolution in a catalytic converter.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">Supervision</span>
            <p><a href="https://scholar.google.com/citations?user=zIHV5hQAAAAJ&hl=en" target="_blank">Dr. Khalil Rhazaoui</a></p>
          </div>
          <div class="project-tags">
            <span class="project-tag">Heat Transfer</span>
            <span class="project-tag">Numerical Methods</span>
            <span class="project-tag">CFD</span>
            <span class="project-tag">MATLAB</span>
            <span class="project-tag">Python</span>
          </div>
        </div>
      </div>
      <div class="project-item">
        <div class="project-summary" tabindex="0" role="button" aria-expanded="false">
          <div class="project-summary-content">
            <span class="project-title">2D/3D Binary Substitutional Alloy Simulation</span>
            <p class="project-meta">Imperial College London · Modelling Project · First Class (Top Honours)</p>
          </div>
          <div class="project-summary-right">
            <a href="https://github.com/wonjunchoii/alloy_modelling" target="_blank" class="project-github-link" title="View on GitHub">
              <i class="fab fa-github"></i>
            </a>
            <span class="project-date">Nov. 2019 – Mar. 2020</span>
          </div>
          <i class="fas fa-chevron-down project-chevron"></i>
        </div>
        <div class="project-details">
          <div class="project-detail-section">
            <span class="project-detail-heading">Outcome</span>
            <p>Reproduced temperature- and composition-dependent phase behavior in binary substitutional alloys.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">What I did</span>
            <p>Performed Monte Carlo simulations in Python to analyze the effects of temperature, composition, and interaction energies in 2D and 3D lattice systems.</p>
          </div>
          <div class="project-detail-section">
            <span class="project-detail-heading">Supervision</span>
            <p><a href="https://scholar.google.com/citations?user=xkfxdHEAAAAJ&hl=en" target="_blank">Prof. Andrew Horsfield</a></p>
          </div>
          <div class="project-tags">
            <span class="project-tag">Monte Carlo</span>
            <span class="project-tag">Statistical Mechanics</span>
            <span class="project-tag">Python</span>
            <span class="project-tag">Alloy Simulation</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="cv-section cv-section--flat">
    <h2 class="cv-section-title"><i class="fas fa-tools"></i> Skills</h2>
    <div class="skills-compact">
      <div class="skill-row">
        <span class="skill-label">Programming</span>
        <span class="skill-content">Python · C/C++ · CUDA · MATLAB · Bash/Shell scripting</span>
      </div>
      <div class="skill-row">
        <span class="skill-label">ML/DL</span>
        <span class="skill-content">PyTorch · PyTorch Geometric · scikit-learn · TensorFlow</span>
      </div>
      <div class="skill-row">
        <span class="skill-label">AI4Materials</span>
        <span class="skill-content">VASP · Quantum ESPRESSO · ASE · Pymatgen · Matminer</span>
      </div>
    </div>
  </section>

  <section class="cv-section cv-section--flat">
    <h2 class="cv-section-title"><i class="fas fa-language"></i> Languages</h2>
    <div class="languages-list">
      <div class="lang-item">
        <span class="lang-name">Korean</span>
        <span class="lang-level native">Native</span>
      </div>
      <div class="lang-item">
        <span class="lang-name">English</span>
        <span class="lang-level fluent">Business Fluent</span>
      </div>
      <div class="lang-item">
        <span class="lang-name">Spanish</span>
        <span class="lang-level basic">Basic Conversational</span>
      </div>
    </div>
  </section>
</div>

<style>
.cv-page {
  max-width: 800px;
  margin: 0 auto;
}

/* ================================
   Hero Header - Improved
   ================================ */
.cv-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--border-color);
}

.cv-title-section {
  flex: 1;
  min-width: 280px;
}

.cv-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--heading-color);
  margin: 0 0 0.5rem;
  line-height: 1.2;
}

.cv-role {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--link-color);
  margin: 0 0 0.35rem;
}

.cv-focus {
  font-size: 0.9rem;
  color: var(--text-muted-color);
  margin: 0;
  letter-spacing: 0.02em;
}

.cv-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: var(--link-color);
  text-decoration: none;
  border: 1.5px solid var(--link-color);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.cv-download-btn:hover {
  background: var(--link-color);
  color: #fff;
  opacity: 0.9;
  transform: translateY(-1px);
  text-decoration: none;
}

/* ================================
   Section Styles
   ================================ */
.cv-section {
  margin-bottom: 2.5rem;
}

.cv-section-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--heading-color);
  margin: 0 0 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.cv-section-title i {
  margin-right: 0.5rem;
  color: var(--link-color);
  font-size: 0.95em;
}

/* ================================
   Timeline (Education / Work only)
   ================================ */
.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-left: 40px;
  position: relative;
}

.timeline-item {
  position: relative;
  padding-bottom: 0.25rem;
}

.timeline-item:not(:last-child) {
  margin-bottom: 1.25rem;
}

/* Timeline dot */
.timeline-item::after {
  content: "";
  position: absolute;
  left: -32px;
  top: 4px;
  width: 14px;
  height: 14px;
  background: var(--main-bg, #14161a);
  border: 2.5px solid var(--link-color);
  border-radius: 50%;
  z-index: 2;
  transition: transform 0.2s ease;
}

/* Timeline line */
.timeline-item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: -26px;
  top: 22px;
  bottom: -20px;
  width: 2px;
  background: var(--link-color);
  opacity: 0.25;
  border-radius: 999px;
  z-index: 1;
}

.timeline-item:hover::after {
  transform: scale(1.15);
}

/* Title - strongest emphasis */
.timeline-item-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--heading-color);
  margin-bottom: 2px;
}

/* Degree/Role - secondary emphasis */
.timeline-degree {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 4px;
}

/* Date/Location - lightest */
.timeline-meta {
  display: inline-block;
  font-size: 0.8rem;
  color: var(--text-muted-color);
  font-weight: 400;
  opacity: 0.8;
  margin-bottom: 4px;
}

/* Detail text (advisor) */
.timeline-text.detail {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--text-muted-color);
  opacity: 0.75;
  margin: 4px 0 0;
}

.timeline-text.detail a {
  color: var(--link-color);
  text-decoration: none;
}

.timeline-text.detail a:hover {
  text-decoration: underline;
}

/* ================================
   Flat Sections (Projects, Skills)
   ================================ */
.cv-section--flat .projects-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.project-item {
  background: var(--card-bg, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color);
  border-radius: 10px;
  transition: all 0.25s ease;
  overflow: hidden;
  position: relative;
}

.project-item:hover {
  border-color: var(--link-color);
}

.project-item.active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Click feedback - ring effect that fades out */
.project-item::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 10px;
  border: 4px solid transparent;
  pointer-events: none;
  opacity: 0;
  transition: opacity 2.0s ease-out;
  z-index: 10;
}

.project-item.clicked::before {
  border-color: var(--link-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
  opacity: 1;
  animation: ringFadeOut 1.0s ease-out forwards;
}

@keyframes ringFadeOut {
  0% {
    opacity: 1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
  }
  100% {
    opacity: 0;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

/* Summary - Always visible, clickable */
.project-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  user-select: none;
  gap: 0.75rem;
  transition: background-color 0.2s ease;
}

.project-item:not(.active):not(.no-hover) .project-summary:hover:not(:active) {
  background: rgba(var(--link-color-rgb, 99, 102, 241), 0.05);
}

.project-summary:focus {
  outline: none;
}

/* Show outline only for keyboard navigation */
.project-summary:focus-visible {
  outline: 2px solid var(--link-color);
  outline-offset: -2px;
  border-radius: 10px;
}

.project-summary-content {
  flex: 1;
  min-width: 0;
}

.project-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--heading-color);
  line-height: 1.4;
  display: block;
}

.project-summary-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.project-date {
  font-size: 0.75rem;
  color: var(--text-muted-color);
  opacity: 0.6;
  font-weight: 400;
  white-space: nowrap;
  width: 100px;
  text-align: right;
}

/* Project meta in summary */
.project-summary .project-meta {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--text-muted-color);
  margin: 0.25rem 0 0;
  opacity: 0.75;
  border-bottom: none;
  padding-bottom: 0;
}
.project-pdf-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(var(--link-color-rgb, 99, 102, 241), 0.1);
  color: rgba(255, 155, 176, 0.9);
  text-decoration: none;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.project-pdf-link:hover {
  background:rgba(255, 155, 176, 0.4);
  color: #fff;
  transform: scale(1.1);
}

.project-github-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(var(--link-color-rgb, 99, 102, 241), 0.1);
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.project-github-link:hover {
  background: var(--link-color);
  color: #fff;
  transform: scale(1.1);
}

/* Hide GitHub link if href is empty or missing */
.project-github-link[href=""],
.project-github-link:not([href]),
.project-github-link[href="#"] {
  display: none;
}

.project-chevron {
  font-size: 0.75rem;
  color: var(--text-muted-color);
  opacity: 0.6;
  transition: transform 0.3s ease, opacity 0.2s ease;
  flex-shrink: 0;
}

.project-item.active .project-chevron {
  transform: rotate(180deg);
  opacity: 1;
}

/* Details - Hidden by default, shown when active */
.project-details {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.3s ease, padding 0.3s ease;
  padding: 0 1.25rem;
}

.project-item.active .project-details {
  max-height: 600px;
  opacity: 1;
  padding: 0 1.25rem 1.25rem;
}

/* Project meta info (institution, type, award) */
.project-meta {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--link-color);
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  opacity: 0.9;
}

/* Detail sections (Outcome, What I did, Supervision) */
.project-detail-section {
  margin-bottom: 0.875rem;
}

.project-detail-section:last-of-type {
  margin-bottom: 0;
}

.project-detail-heading {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.35rem;
  opacity: 0.7;
}

.project-detail-section p {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-color);
  margin: 0;
  opacity: 0.9;
}

.project-detail-section a {
  color: var(--link-color);
  text-decoration: none;
}

.project-detail-section a:hover {
  text-decoration: underline;
}

.project-detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.82rem;
  line-height: 1.5;
}

.project-detail-content {
  margin: 0.75rem 0;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--text-muted-color);
  opacity: 0.85;
}

.project-detail-content p {
  margin: 0;
}

.project-detail-label {
  font-weight: 600;
  color: var(--text-muted-color);
  opacity: 0.8;
  flex-shrink: 0;
  min-width: 80px;
}

.project-detail-value {
  color: var(--text-muted-color);
  opacity: 0.85;
  flex: 1;
}

.project-detail-value a {
  color: var(--link-color);
  text-decoration: none;
}

.project-detail-value a:hover {
  text-decoration: underline;
}

/* Tags - Pill/Badge style */
.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  opacity: 0.9;
}

.project-tag {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: rgba(var(--text-muted-color-rgb, 128, 128, 128), 0.15);
  color: var(--text-muted-color);
  opacity: 0.8;
  white-space: nowrap;
}

/* ================================
   Skills - Compact Layout
   ================================ */
.skills-compact {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* 한 줄 한 줄이 카드처럼 '정돈'되어 보이게 */
.skill-row {
  display: flex;
  align-items: flex-start;
  gap: 1.1rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.skill-row:last-child {
  border-bottom: none;
}

/* 왼쪽 라벨: 더 라벨답게 (작게, 선명하게, 읽기 쉬운 위계) */
.skill-label {
  flex-shrink: 0;
  width: 140px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em; 
  text-transform: uppercase;
  color: var(--link-color);
  opacity: 0.95;
}

.skill-content {
  font-size: 0.95rem;
  line-height: 1.7;
  word-spacing: 0.12em;
  color: color-mix(in srgb, var(--text-color) 92%, white 8%);
}

/* 작은 디테일: 줄이 길어질 때 자연스럽게 줄바꿈 */
.skill-content,
.skill-label {
  min-width: 0;
}

/* 너무 튀지 않는 '고급' hover */
.skill-row {
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  border-radius: 10px;
}

.skill-row:hover {
  background: rgba(255,255,255,0.03);
  border-bottom-color: rgba(255,255,255,0.10);
  transform: translateY(-1px);
}

/* 모바일에서 라벨 폭 자동 조정 */
@media (max-width: 520px) {
  .skill-row {
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.45rem 0;
  }

  .skill-label {
    width: auto;
  }
}


/* ================================
   Languages
   ================================ */
.languages-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  background: var(--card-bg, rgba(255,255,255,0.02));
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.lang-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--heading-color);
}

.lang-level {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.lang-level.native {
  background: rgba(var(--link-color-rgb, 99, 102, 241), 0.15);
  color: var(--link-color);
}

.lang-level.fluent {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.lang-level.basic {
  background: rgba(251, 191, 36, 0.15);
  color: #f59e0b;
}

/* ================================
   Responsive
   ================================ */
@media (max-width: 600px) {
  .cv-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .cv-download-btn {
    margin-top: 0.5rem;
  }
  
  .timeline-list {
    margin-left: 28px;
  }
  
  .timeline-item::after {
    left: -22px;
    width: 12px;
    height: 12px;
  }
  
  .timeline-item:not(:last-child)::before {
    left: -17px;
    top: 18px;
  }
  
  .skill-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .skill-label {
    width: auto;
  }
  
  .project-summary {
    padding: 0.875rem 1rem;
    position: relative;
    padding-right: 2rem;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  
  .project-summary-content {
    width: 100%;
    order: 2;
  }
  
  .project-summary-right {
    order: 1;
    width: 100%;
    margin-bottom: 0.5rem;
    justify-content: flex-start;
  }
  
  .project-date {
    width: auto;
    text-align: left;
  }
  
  .project-chevron {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
  
  .project-summary .project-meta {
    font-size: 0.75rem;
  }
  
  .project-details {
    padding: 0 1rem;
  }
  
  .project-item.active .project-details {
    padding: 0 1rem 1rem;
  }
  
  .project-detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .project-detail-label {
    min-width: auto;
  }
  
  .project-tags {
    gap: 0.4rem;
  }
  
  .project-tag {
    font-size: 0.65rem;
    padding: 0.15rem 0.5rem;
  }
}
</style>

<script src="/assets/js/cv-accordion.js"></script>

