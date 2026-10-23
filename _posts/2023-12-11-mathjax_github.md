---
title: MathJax 를 이용하여 블로그에 수학 수식 쓰기
date: 2023-12-11 19:35:00 +0900
categories: [Blogging, Math]
tags: [mathjax, latex, jekyll, github pages]
use_math: true
---
## MathJax
Jekyll Github 블로그에 수학식을 작성하려 했는데 내가 원하는대로 나오지 않았다... 찾아보니 수학 식 표기를 변환시켜주는 추가 엔진을 따로 설정해줘야 한다고 한다. 아래와 같은 방법으로 간단하게 추가했다.

### MathJax 적용방법
#### 1. 마크다운 엔진 변경
`_config.yml` 파일에 아래와 같은 코드를 추가해준다

```yml
markdown: kramdown
highlighter: rouge
lsi: false
excerpt_separator: "\n\n"
incremental: false
```

#### 2. 파일 추가
`_includes` 디렉토리에 `mathjax_support.html` 파일을 생성 한 후, 아래와 같이 코드를 작성한다.

```html
<script type="text/x-mathjax-config">
MathJax.Hub.Config({
    TeX: {
      equationNumbers: {
        autoNumber: "AMS"
      }
    },
    tex2jax: {
    inlineMath: [ ['$', '$'] ],
    displayMath: [ ['$$', '$$'] ],
    processEscapes: true,
  }
});
MathJax.Hub.Register.MessageHook("Math Processing Error",function (message) {
	  alert("Math Processing Error: "+message[1]);
	});
MathJax.Hub.Register.MessageHook("TeX Jax - parse error",function (message) {
	  alert("Math Processing Error: "+message[1]);
	});
</script>
<script type="text/javascript" async
  src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML">
</script>
```

> 2026년 수정: `cdn.mathjax.org`는 2017년에 서비스가 종료되어 지금은 동작하지 않는다. 아래 "MathJax 오류" 부분의 MathJax v3 설정을 사용하자.

#### 3. 코드 추가
2번 과정에서 작성한 코드를 포스트에 적용시켜주기 위해 조건문을 추가해 줘야한다.

`_layouts/default.html` 파일의 `<head>` 부분에 다음과 같은 코드를 삽입해 준다.

{% raw %}
```html
{% if page.use_math %}
  {% include mathjax_support.html %}
{% endif %}
```
{% endraw %}

#### 4. 포스트 작성
이제 설정이 끝났으니, 포스트 작성 시 front-matter 에 `use_math: true` 작성 후 사용하면 된다!

```markdown
---
title: MathJax 를 이용하여 블로그에 수학 수식 쓰기
date: -
categories: []
tags: []
use_math: true

---
```

예시는 아래와 같다

```tex
$$
\hat{H} \psi(\mathbf{r}, t) = i\hbar \frac{\partial}{\partial t} \psi(\mathbf{r}, t)
$$
```

\\[
\hat{H} \psi(\mathbf{r}, t) = i\hbar \frac{\partial}{\partial t} \psi(\mathbf{r}, t)
\\]

### MathJax 오류
위와 같이 수식을 잘 작성했음에도 불구하고 처음 적용했을 때, 수학식으로 변환되지 않고 빌드가 되었다. 여러 블로그를 찾아보니, MathJax 버전 2가 안된다고 한다.

기존 in-line 수식은 `$...$` 을 사용하여 \\( f(x)=2x^2+3x-8 \\) 과 같이 작성하고, display-mode로 작성하고 싶으면, `$$...$$` 를 이용하여 

\\[ f(x)=2x^2+3x-8 \\]

처럼 작성할 수 있다고 알고 있었다. 하지만 공식 블로그에 따르면,

> The default math delimiters are `$$...$$` and `\[...\]` for displayed mathematics, and `\(...\)` for in-line mathematics. Note in particular that the `$...$` in-line delimiters are not used by default. ([doc](https://docs.mathjax.org/en/v3.0-latest/basic/mathematics.html#tex-and-latex-input))

미국 달러 기호와 헷갈릴수 있으니 달러 표시보다, in-line 에서는 `\\( ... \\)`, display-mode 에서는 `\\[ ... \\]` 를 사용해야한다.

일단 2번 과정에서 작성했었던 `mathjax_support.html` 파일을 지우고, 새로 작성해준다.

```html
<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    }
  };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
```

> 2026년 수정: 처음에는 `MathJax.Hub.Config({...})` 형태로 설정을 적었는데, 이건 MathJax v2 문법이라 v3에서는 무시된다. 그래서 한동안 `$...$` 인라인 수식이 렌더링되지 않고 있었다. v3에서는 위처럼 `window.MathJax` 객체로 설정해야 한다.

이렇게 되면 이제 자유롭게 수학 표현식을 사용할 수 있다!
