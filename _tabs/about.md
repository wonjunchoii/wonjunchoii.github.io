---
lang: en
layout: page
title: About
icon: fas fa-user
order: 4
---

<div class="about-page-simple">
  <!-- About -->
  <div class="about-section">
    <p>
      I’m a Ph.D. student working on <strong>AI for Materials Science</strong>.
      My research focuses on building machine learning models that respect
      physics and remain practically useful, even when data is limited.
    </p>
    <p>
      Outside the lab, I enjoy staying active and creative, usually while simulations are running in the background.
    </p>
    <div class="chips" aria-label="Interests">
      <span class="chip"><i class="fas fa-dumbbell"></i> Gym</span>
      <span class="chip"><i class="fas fa-guitar"></i> Guitar</span>
      <span class="chip"><i class="fas fa-golf-ball-tee"></i> Golf</span>
      <span class="chip"><i class="fas fa-whiskey-glass"></i> Whisky</span>
    </div>
    <p>
      This site is a personal space where I document my work, ideas,
      and things I find interesting along the way.
    </p>
  </div>

  <!-- Research Philosophy -->
  <section class="about-section">
    <h2>Research Philosophy</h2>
    <p>
      I believe good research sits somewhere between <strong>rigor</strong> and
      <strong>intuition</strong>. I enjoy problems where physics matters,
      assumptions must be questioned, and results need to be trusted —
      not just optimized.
    </p>
    <p>
      I value approaches that are <strong>simple, explainable, and reproducible</strong>.
      Progress is often slow, but steady improvement matters more than quick wins.
    </p>
  </section>

  <!-- Beyond Research -->
  <section class="about-section">
    <h2>Beyond Research</h2>
    <p>
      Having interests beyond research helps me keep perspective.
      Training, music, sports, and small routines outside the lab
      remind me that learning curves exist everywhere —
      and that patience and consistency matter just as much off the screen
      as they do in research.
    </p>
  </section>

  <section class="about-section">
    <h2>Connect</h2>
    <div class="about-links">
      <a href="mailto:wonjun.choi@snu.ac.kr" class="about-link">
        <i class="fas fa-envelope"></i>
        <span>wonjun.choi@snu.ac.kr</span>
      </a>
      <a href="https://github.com/wonjunchoii" target="_blank" rel="noopener" class="about-link">
        <i class="fab fa-github"></i>
        <span>GitHub</span>
      </a>
      <a href="https://scholar.google.com/citations?user=YOUR_SCHOLAR_ID" target="_blank" rel="noopener" class="about-link">
        <i class="fas fa-graduation-cap"></i>
        <span>Google Scholar</span>
      </a>
      <a href="https://www.linkedin.com/in/choi-wonj/" target="_blank" rel="noopener" class="about-link">
        <i class="fab fa-linkedin"></i>
        <span>LinkedIn</span>
      </a>
    </div>
  </section>
</div>

<style>
.about-page-simple {
  max-width: 700px;
  margin: 0 auto;
}

.about-section {
  font-size: 1.05rem;
  line-height: 1.8;
  margin-bottom: 2.5rem;
}

.about-section p {
  margin-bottom: 1rem;
}

.about-section a {
  color: var(--link-color);
  text-decoration: none;
}

.about-section a:hover {
  text-decoration: underline;
}

.about-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--heading-color);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.about-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--card-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.about-link i {
  color: var(--link-color);
}

.about-link:hover {
  border-color: var(--link-color);
  text-decoration: none;
}

.chips{ display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom: 16px}
.chip{
  font-size:0.85em;
  padding:0.25em 0.6em;
  border:1px solid rgba(255,255,255,0.14);
  border-radius:999px;
  opacity:0.85;
  transition: transform 0.2s ease, color 0.2s ease;
}

.chip i {
  font-size: 0.75em;      /* 중요: 텍스트보다 작게 */
  opacity: 0.7;          /* 아이콘 존재감 줄이기 */
}

.chip:hover{
  transform: translateY(-1px);
  color: #e5e7eb;
}
</style>
