---
lang: en
layout: page
title: Publications
icon: fas fa-file-alt
order: 2
---

<div id="publications" class="tab-content">

  <section class="pub-section">
    <!-- Desktop filter tabs -->
    <ul class="filter-list">
      <li class="filter-item">
        <button class="active" data-filter-btn>All</button>
      </li>
      <li class="filter-item">
        <button data-filter-btn>Journal</button>
      </li>
      <li class="filter-item">
        <button data-filter-btn>Conference</button>
      </li>
      <li class="filter-item">
        <button data-filter-btn>Preprint</button>
      </li>
    </ul>
    <!-- Publication cards (auto-generated from _data/publications.yml) -->
    <ul class="pub-list">
      {% assign sorted_pubs = site.data.publications | sort: "date" | reverse %}
      {% for pub in sorted_pubs %}
      <li class="pub-card active" data-filter-item data-category="{{ pub.category }}">
        <a href="{{ pub.url }}" target="_blank" rel="noopener">
          <figure class="pub-img">
            <div class="pub-icon-box">
              <i class="fas fa-eye"></i>
            </div>
            <img src="{{ pub.image }}" alt="{{ pub.title }}" loading="lazy">
          </figure>
          <h3 class="pub-title"><b>{{ pub.title }}</b></h3>
          <p class="pub-authors">
            {%- for author in pub.authors -%}
              {%- if forloop.index0 == pub.me -%}<u>{{ author }}</u>{%- else -%}{{ author }}{%- endif -%}
              {%- unless forloop.last -%}, {% endunless -%}
            {%- endfor -%}
          </p>
          <p class="pub-venue">{{ pub.venue }}</p>
        </a>
      </li>
      {% endfor %}
    </ul>

  </section>
</div>

<script src="/assets/js/publications.js"></script>


