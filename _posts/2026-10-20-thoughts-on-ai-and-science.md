---
title: AI가 바꾸는 과학에 대한 생각
date: 2026-10-20 12:00:00 +0900
categories: [Blogging, Essay]
tags: [essay, ai for science, computational science, research, discovery, understanding]
---

## 계기

9월 20일 코엑스에서 Nobel Prize Dialogue Seoul 2026이 있었다. 주제는 "AI가 바꾸는 과학의 미래".
발표들을 보고 많은 생각이 들었다. 결국 말하고자 하는 건 하나였다.

> 맞긴 맞는데 왜 맞는지 아무도 모르는 답이 있다면, 그걸 과학이라고 불러도 될까?

KIAS 김상현 교수님은 수학에서 정리를 발견하는 것과 그게 왜 참인지 이해하는 것은 거의 항상 같이 갔는데, AI 때문에 처음으로 둘이 떨어지기 시작했고, 그 간극이 계속 커지고 있다고 했다.
발견은 빨라지는데 이해는 그 속도를 못 따라갈 수도 있다는 얘기였다.

그런데 이 질문이 남 얘기 같지가 않았다.

## 요즘 수학 쪽

이 질문이 현실적으로 느껴진 건 요즘 수학 쪽 소식 때문이다. 몇 달 사이에 일이 너무 많았다.

### Navier-Stokes

예전 회사에서 유체 해석을 했던 터라 이 소식은 특히 눈에 들어왔다.
9월 8일에 OpenAI가 내부 AI 시스템으로 Navier-Stokes 밀레니엄 문제의 답을 만들었다고 발표했다. ([OpenAI](https://openai.com/ko-KR/index/navier-stokes-solution/))
정지해 있던 매끄러운 유체에 매끄러운 외력을 줘도 유한 시간 안에 특이점이 생길 수 있다는 증명이다. Lean으로 형식화한 증명도 같이 냈다.

푼 방식이 더 충격이었다.
agent들을 여러 그룹으로 나눠서 문제를 여러 형태로 동시에 탐색시키고, 그룹마다 나온 중간 결과를 다른 그룹에 계속 공유했다고 한다.
답을 찾은 그룹에만 agent가 약 10,000개였고, 처음 돌리기 시작해서 약 88시간 만에 답이 나왔다.
이 문제 하나에 메시지가 270만 건, 출력 토큰이 약 1,300억 개. Lean 형식화와 검증에 17시간이 더 걸렸다고 한다.
천재 한 명이 푼 게 아니라 수천 개의 agent가 탐색 공간을 통째로 뒤진 거다.

Clay 수학연구소는 9월 11일에 이 문제가 "apparently been settled"라고 성명을 냈다. 공식 검증이랑 상금 절차는 일부러 천천히 한다고. ([Clay Mathematics Institute](https://www.claymath.org/news/navier-stokes-announcement/))
Zhen Lei와 Xiao Ren은 OpenAI 증명의 핵심을 사람이 읽기 쉽게 다시 정리한 논문을 내면서 "major advance"라고 했다. ([arXiv:2609.35406](https://arxiv.org/abs/2609.35406))

그런데 AI가 아무것도 없는 데서 아이디어를 만든 건 아니었다.
OpenAI가 쓴 방법은 스페인 수학자 Diego Cordoba와 Luis Martinez-Zoroa가 2023년부터 발전시켜 온 방법에 기반하고 있었다.
Cordoba는 AI가 한 일은 새 아이디어를 낸 게 아니라 "시간을 번 것"이라고 했다. Martinez-Zoroa는 AI가 남의 아이디어를 가져가서 몇 시간 만에 풀어버릴 수 있다면 연구자들이 결과를 공개할 이유가 뭐냐고 했다. ([El Pais](https://elpais.com/ciencia/2026-09-10/un-ano-de-trabajo-de-dos-matematicos-espanoles-frente-a-88-horas-y-15-millones-de-openai-sin-nuestra-idea-la-ia-no-lo-habria-resuelto.html))
같은 방향을 연구하던 NYU의 Tristan Buckmaster와 Anthropic의 Levent Alpoge를 둘러싼 attribution 논쟁도 있었다. Buckmaster는 자기 작업이 OpenAI 결과에 영향을 줬을 가능성을 제기했고, OpenAI는 강하게 부인하고 있다. ([The Verge](https://www.theverge.com/ai-artificial-intelligence/994255/openai-millennium-prize-problem-tristan-buckmaster-competition))

### 4,000개의 문제

한 달 뒤 10월 6일에는 내부 모델에 약 4,000개의 연구 문제를 던져서 나온 결과를 한꺼번에 공개했다.
결과 하나에 평균 ChatGPT Pro 3시간 정도의 thinking compute가 들었다고 한다.
처음에 722편이 올라왔는데 다음 날 부호 오류로 3편이 철회되고 14편이 수정됐다. ([CellCog](https://cellcog.ai/blog/openai-math-results/))
지금은 719편이 372개 묶음으로 정리돼 있고, Lean으로 검증된 건 약 42%다. 검증 안 된 결과에는 오류가 있을 수 있다고 OpenAI도 적어놨다. ([GitHub: openai/math](https://github.com/openai/math))
AI가 논문 700편을 쓴 게 아니라, 후보 700편을 쏟아냈고 이제 사람이 하나씩 보는 중이라고 하는 게 맞는 것 같다.

### DeepMind

DeepMind는 그 전에 Gemini 기반 agent인 Aletheia를 Erdos 문제 데이터베이스의 open 문제 700개에 돌렸다. ([arXiv:2601.22401](https://arxiv.org/abs/2601.22401))
13개를 풀었는데 새로운 해법은 5개였고, 나머지 8개는 이미 문헌에 답이 있었는데 데이터베이스에 반영이 안 돼 있던 거였다.
논문은 이 문제들이 open이었던 게 어려워서가 아니라 잘 안 알려져서였다고 정리했다.
Aletheia는 사람 개입 없이 처음부터 끝까지 쓴 연구 논문도 하나 냈다. ([arXiv:2602.10177](https://arxiv.org/abs/2602.10177), [Google DeepMind](https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/))
장점 중 하나로 "못 푸는 문제를 못 푼다고 인정할 수 있다"를 꼽은 게 기억에 남는다.

### 순서가 뒤집히는 중

7월에는 GPT-5.5 Pro 기반의 단순한 agent가 실수 위에서의 sum-product 추측을 반증하는 증명을 8번 중 7번 만들어냈다는 논문이 나왔다. ([arXiv:2607.20525](https://arxiv.org/abs/2607.20525))
9월에는 GPT-6 Astra가 찾은 Erdos-Sos 정리의 짧은 증명을 사람이 그림으로 다시 풀어 쓴 논문이 나왔다. ([arXiv:2609.32011](https://arxiv.org/abs/2609.32011))

마지막 건 좀 이상한 기분이 들었다.
원래는 사람이 아이디어를 내고, 증명하고, 이해하고, 논문을 썼다.
이제는 AI가 증명을 찾고, 사람이 검증하고, 사람이 그걸 이해해서 설명을 다시 쓴다. 순서가 반대가 됐다.

### 수학자들

9월 11일에 Terence Tao를 포함한 필즈상 수상자 25명이 "A Severe Misalignment of AI in Mathematics"라는 성명을 냈다. ([Terence Tao 블로그](https://terrytao.wordpress.com/2026/09/11/a-severe-misalignment-of-ai-in-mathematics/))

> solving problems is only a tool and proxy for achieving the primary goal of conceptual understanding and insight.

문제를 푸는 건 이해로 가는 도구일 뿐이라는 얘기다.
AI 회사 입장에서는 open problem 몇 개 풀었는지가 제일 깔끔한 benchmark겠지만, 수학이 원래 하려던 건 그게 아니었다는 거다.

Tao는 ICM 강연을 바탕으로 쓴 글에서 AI가 연구 수준의 수학을 할 수 있느냐보다 수학 연구의 목표와 가치가 뭔지를 다시 물어야 한다고 했다. ([arXiv:2608.16753](https://arxiv.org/abs/2608.16753))
최근 인터뷰에서는 수학의 "낭만의 시대"가 끝나고 "산업의 시대"로 가고 있다고, 새로운 게 가능해지는 대신 잃는 것도 있다고 했다. ([Business Insider](https://www.businessinsider.com/math-ai-tools-openai-terence-tao-ucla-2026-10))
같은 기사에서 Buckmaster는 OpenAI의 대량 공개 때문에 연구 프로그램 전체가 하루아침에 날아갔다고 했다.

이것저것 보고 나서 든 생각은 이렇다.
예전에는 증명을 만드는 능력이 제일 귀했다. AI가 증명 후보를 수천 개씩 만들기 시작하면 귀한 건 검증하고, 고르고, 해석하고, 설명하는 쪽으로 넘어간다.
발견은 거의 공짜가 되는데 이해하는 데 드는 비용은 그대로다.

## 창의성도 결국 응용일까

계속 머리에 맴도는 생각이 있다.
과학에서 제일 사람다운 부분을 창의성이라고 하는데, 창의성도 결국 내가 가진 지식을 모으고 분석해서 다른 데 응용하는 거 아닌가?

Navier-Stokes 방정식도 뉴턴의 F = ma를 유체에 적용한 거다.
F = ma도 사과 얘기처럼 결국 물체가 움직이는 걸 오래 관찰하고 분석해서 나온 거고.
미적분은 없던 개념을 만든 거지만, 그것도 움직이는 물체를 기술하려고 시행착오를 엄청 거쳐서 나왔다.
상대성이론은 진짜 창의의 영역 같다. 그래도 아인슈타인이 맨땅에서 만든 건 아니다. 맥스웰 방정식, 로렌츠 변환, 마이컬슨-몰리 실험 같은 재료가 이미 있었고, 아인슈타인은 그걸 누구보다 깊고 넓게 알고 있었고, 그걸 새로 엮었다.

그러면 천재라는 건, 아인슈타인 같은 사람은, 남들보다 아는 게 훨씬 많고 아는 것들 사이의 관계를 훨씬 잘 보는 사람이었던 것 같다.
AI는 곧 어떤 사람보다 많은 정보를 갖게 될 거고, 지식 사이의 관계도 훨씬 체계적으로 갖게 될 거다.
사람처럼 데이터를 이어서 생각하는 기술까지 생기면, 지금 우리가 창의라고 부르는 것도 상당 부분 응용 쪽으로 들어가지 않을까.
Navier-Stokes에서 agent 10,000개가 한 것도 사람이 평생 못 볼 조합을 88시간 만에 뒤진 거였다. 양이 충분히 많아지면 질이 달라진다.

반대 얘기도 있긴 하다.
Cordoba 말로는 이번에도 핵심 아이디어는 사람한테서 나왔고 AI는 그걸 끝까지 밀어붙인 거다.
아인슈타인이 한 것도 재료를 모은 것보다 "동시성이 뭔가" 같은 당연하던 개념을 다시 정의한 거에 가깝다. 재료는 그때 다른 사람들도 갖고 있었다.
있는 지식을 엮는 거랑 지식을 담는 틀 자체를 바꾸는 건 좀 다른 일일 수도 있다.

인지과학자 Margaret Boden은 창의성을 세 가지로 나눴다.

* 조합(combinational): 있는 아이디어를 새롭게 엮는 것
* 탐색(exploratory): 정해진 개념 공간 안을 깊이 파고드는 것
* 변형(transformational): 그 공간의 규칙 자체를 바꾸는 것

이렇게 보면 지금 AI가 잘하는 건 앞의 두 개다. 엄청나게 많이 엮어보고, 엄청나게 깊이 파본다. Navier-Stokes도 이쪽에 가깝다.
아인슈타인이 한 건 세 번째에 가깝다. 시간과 공간을 담는 틀 자체를 바꿨다.
문제는 세 번째도 결국 앞의 두 개를 충분히 많이 하다 보면 나오는 건지, 아니면 아예 다른 종류의 일인지다. 이건 아무도 모르는 것 같다.

근데 솔직히 그것도 지금은 그렇다는 얘기 같다.
틀을 바꾸는 것도 충분히 큰 탐색이랑 충분히 많은 연결에서 나오는 거라면 언젠가는 AI가 그것도 할 것 같다.
과학은 아직 사람 영역이라고 믿고 싶은데, 그게 언제까지일지는 모르겠다.

그래서 질문이 바뀐다. 창의성까지 응용이라면 과학에서 사람한테 남는 건 뭘까.
지금 떠오르는 건 두 개다. 뭘 알고 싶은지 정하는 것. 그리고 그렇게 얻은 걸 이해하고 책임지는 것.
AI가 아무리 많이 찾아도 뭐가 알 가치가 있는지, 그 앎이 누구를 위한 건지는 결국 사람이 정해야 할 것 같다.

## 수학만의 얘기는 아니다

수학은 그래도 낫다. Lean이 있어서 참인지 아닌지는 기계로 확인할 수 있다.
자연과학이랑 공학에서 참을 정하는 건 결국 실험이고 관측이다. 실험은 느리고 비싸고 자동화도 어렵다.

AI가 새 물질, 약물 후보, 설계안을 수천 수만 개씩 내놓는 건 이미 어느 정도 일어나고 있다.
후보 찾는 비용은 확 줄었는데 그게 맞는지 확인하는 비용은 거의 그대로다.
수학에서 말하는 검증 병목이 자연과학에서는 더 심할 거다.

왜 되는지 모르는데 일단 되는 결과도 많아질 거다.
옥스퍼드 앨리슨 노블 교수님은 그런 결과가 벌써 나오고 있고, 결과를 먼저 내고 원리는 나중에 찾아야 하는지 과학 출판 방식 자체가 문제가 될 수 있다고 했다.
한양대 이상욱 교수님은 AI가 찾은 치료법이 효과가 있어도, 왜 효과가 있는지 모르면 예상 못 한 상황에서 실패할지 판단하기 어렵다고 했다.

이번 달 노벨화학상 소식을 보면서도 비슷한 생각을 했다. Henri Kagan과 Kenso Soai가 받았는데, 결국 chirality, 구조는 같고 거울에 비친 것처럼 좌우만 다른 분자에 대한 얘기다.
이런 분자는 몸 안에서 전혀 다르게 반응할 수 있다. 탈리도마이드가 그랬다. 한쪽은 진정제였는데 다른 쪽은 기형을 일으켰다.
"이 약이 듣는다"만 알아서는 막을 수 없는 일이다. 왜 좌우가 다르면 반응이 달라지는지를 알아야 부작용을 예측할 수 있다.

공학에서는 이게 중요하다.
수학 정리는 한 번 증명되면 끝인데 자연과학 결과는 실제 세상에 쓰이고, 쓰이는 조건은 매번 조금씩 다르다.
이 조건에서 됐다고 저 조건에서도 된다고 말할 수는 없다. 그걸 말할 수 있게 해주는 게 이해다.

사실 공학은 원래 완전히 이해 못 한 것도 써왔다. 난류 모델이나 수많은 경험식이 그렇다.
다만 그때는 어디까지 믿어도 되는지는 알고 있었다. 적용 범위를 알고, 안전 계수를 두고, 범위를 벗어나면 다시 확인했다.
AI 결과에서 문제는 이해가 없다는 것보다 어디까지 믿어도 되는지 모른다는 쪽인 것 같다.

## 계산과학을 하는 입장에서

생각해 보면 계산과학 하는 사람들은 원래 이 간극 속에서 일해왔다.

시뮬레이션은 원래 답을 먼저 준다. 방정식을 풀면 숫자가 나오고, 왜 그 숫자인지는 그다음에 사람이 해석한다.
우리가 쓰는 모델은 다 근사다. "모든 모델은 틀렸지만 일부는 유용하다"는 말처럼, 틀린 줄 아는 모델로 쓸 만한 답을 얻는 게 원래 하던 일이다.

그래서 이 간극을 다루는 습관이 이미 있다. V&V라고 부르는 거.

* Verification: 방정식을 제대로 풀었나
* Validation: 애초에 맞는 방정식을 풀었나

여기에 수렴 테스트, 오차 막대, 적용 범위, 실험이랑 비교하는 것까지.
AI가 연구에 깊이 들어올수록 이 습관이 더 필요할 것 같다.
AI가 내놓는 것도 결국 모델의 출력이고, 그걸 어디까지 믿을지 판단하는 건 원래 하던 일이랑 크게 다르지 않다.

그래서 AI를 무조건 반기거나 무조건 경계하기보다 또 하나의 근사 모델로 대하면 되지 않을까 싶다.
쓸모 있으면 쓰고, 어디서 틀릴 수 있는지를 먼저 묻는 것.
LG AI연구원 이홍락 교수님이 지금 AI를 "부조종사"에 비유한 것도 비슷하게 들렸다. 사람이 놓친 연결은 찾아주지만, 그걸 어디에 쓸지 정하고 확인하는 건 아직 사람이 한다.

## 간극이 점점 커지는 것

Cordoba가 AI는 시간을 번 거라고 했을 때 처음엔 AI를 깎아내리는 말처럼 들렸다.
근데 곱씹어 보니 좀 무서운 말이다. AI가 번 건 발견하는 시간이지 이해하는 시간이 아니다.

발견하는 속도는 compute를 늘리면 빨라진다. agent를 10개에서 10,000개로 늘리면 된다.
이해하는 속도는 그렇게 안 늘어난다. 사람이 증명을 읽고 납득하고 다른 지식이랑 연결하는 데 걸리는 시간은 예전이랑 비슷하다.
한쪽은 계속 빨라지고 한쪽은 그대로니까 간극은 계속 벌어질 수밖에 없다.

더 걱정되는 건 이게 쌓인다는 거다.
과학은 앞의 결과 위에 다음 결과를 쌓는다. 아무도 제대로 이해 못 한 결과 위에 다음 결과가 쌓이고 그 위에 또 쌓이면 어떻게 될까.
소프트웨어에서 당장 돌아가게 하려고 미뤄둔 문제를 기술 부채라고 하는데, 과학에도 이해의 부채 같은 게 쌓일 것 같다.
지금은 잘 돌아가는데 어디선가 틀린 게 밝혀지면 그 위에 쌓인 걸 다 다시 봐야 하는 상황.
기술 쪽은 더하다. 왜 되는지 모르는 게 제품이랑 시스템에 들어가기 시작하면 언제 실패할지 미리 알기가 더 어려워진다.

만드는 쪽도 비슷한 고민을 하긴 하는 것 같다.
OpenAI는 Navier-Stokes 발표 끝에 지금은 모델을 이해하는 데 집중하고 있고 앞으로 발전 속도를 더 신중하게 정해야 할 수도 있다고 썼다.
필즈상 성명이 걱정한 것도 같은 거다. 제대로 정리되고 설명되지 않은 결과가 급하게 쏟아지면, 아이디어가 사람에서 사람으로 전해지는 고리가 끊길 수 있다는 것.

## 그럼 어떻게 해야 하나

답은 모르겠다. 그냥 지금 드는 생각들.

간극이 있다는 걸 숨기지 않는 것. 크레이그 멜로 교수님 말처럼 발견과 이해 사이의 간격은 원래 있었다. 가속팽창을 발견했다고 암흑에너지를 이해한 건 아니다.
간극 자체가 문제가 아니라 그게 안 보이게 되는 게 문제인 것 같다.
OpenAI가 결과마다 검증 단계가 다르다고 적어둔 거나, DeepMind가 AI 기여 정도를 분류하는 기준을 만든 건 그런 의미에서 괜찮은 방향이다.
작동한다, 검증됐다, 이해됐다를 나눠서 적어두기만 해도 다음 사람이 어디부터 파야 할지 안다.

이해하는 일을 성과로 쳐주는 것. AI가 찾은 증명을 사람이 다시 풀어 쓴 논문들이 나오고 있다.
예전 같으면 이미 증명된 걸 다시 설명한 거라고 낮게 봤을 거다.
근데 발견이 흔해지면 설명하고 연결하고 의미를 찾는 일이 제일 귀한 일이 될 수도 있다.

이해하는 데에도 AI를 쓰는 것. 발견을 빠르게 한 게 AI라면 이해를 빠르게 하는 데에도 쓸 수 있을 거다.
Lean 같은 형식 검증은 이미 참인지 확인하는 부담을 기계로 옮기고 있다.
답만 받지 말고 왜 그런 답인지, 뭐가 핵심 가정인지, 어디까지 일반화되는지를 같이 설명하게 하는 것.
간극을 줄이려면 발견을 늦추거나 이해를 빠르게 해야 하는데, 현실적으로는 이해 쪽에 더 힘을 써야 할 것 같다.

속도를 조절하는 것. 그래도 이해 속도만 올려서 다 해결되진 않을 거다.
수백 편을 한 번에 쏟아내기보다 검증되고 정리된 것부터 내놓는 것.
Clay 수학연구소가 절차를 일부러 천천히 한다는 것도 같은 얘기로 읽혔다. 공동체가 소화할 시간을 버는 거다.
발견이 싸지는 시대일수록 서두르지 않는 게 오히려 가치일 수도 있다.

검증을 연구 한가운데로 가져오는 것. 발견이 공짜가 되면 병목은 검증이다.
수학에 Lean이 있다면 자연과학이랑 공학에도 비슷한 게 필요하다. 자동화된 실험, 잘 만든 benchmark, 불확실성을 정량화하는 방법 같은 것들.
검증을 연구 끝나고 하는 뒷정리가 아니라 연구 중심에 둬야 할 것 같다.

뭘 맡기고 뭘 직접 할지 고르는 것. 노블 교수님이 말한 도제 문제(apprentice problem)가 제일 오래 남았다.
숙련된 사람은 AI로 훨씬 빨리 연구할 수 있다. 근데 그 숙련은 직접 해보고, 틀리고, 잘못 해석하고, 다시 고치면서 생긴 거다.
처음부터 AI가 대신해 주면 이제 시작하는 사람은 그 감각을 어디서 얻나.
예전엔 적분표를 뒤져가며 손으로 적분을 했다는데 지금은 아무도 그렇게 안 한다. 그렇다고 지금 사람들이 적분을 모르는 건 아니다.
그런데 모든 일이 다 그런 건 아닌 것 같다. 손을 떼도 괜찮은 일이 있고, 손을 떼는 순간 감이 같이 사라지는 일이 있다.
찰머스 공대 에바 올손은 AI랑 로봇이 발전해도 실험이랑 접촉을 잃으면 안 된다고 했다. 내가 보기엔 그게 후자 쪽 얘기다.
적어도 내가 검증해야 하는 단계는 한 번은 직접 해봐야 뭐가 이상한지 안다.

아이디어를 나누는 문화를 지키는 것. Martinez-Zoroa 질문이 마음에 걸린다.
AI가 남의 아이디어로 몇 시간 만에 문제를 풀어버리면 연구자들은 왜 결과를 공개해야 할까.
과학은 공개하고 인용하고 그 위에 쌓아서 여기까지 왔다. 누가 뭘 기여했는지 제대로 남기는 게 앞으로 더 중요해질 것 같다.

그리고 결국 남는 건 질문 고르기랑 책임.
이수인 교수님은 어떤 문제가 중요한지 아는 걸 아직 사람 과학자의 강점으로 꼽았다. 필즈상 성명도 같은 얘기다. 푸는 건 수단이고 목적은 이해다. 뭘 풀지는 그 목적을 아는 사람이 고를 수 있다.
브라이언 슈미트 교수님은 책임(accountability)이라는 말을 썼다. AI는 발견은 해도 그 발견에 책임은 안 진다.
그 결과를 믿어도 되는지, 실제로 썼을 때 무슨 일이 생길지는 그걸 쓰는 사람이 책임져야 한다.

## 과정

그러다 또 이런 생각이 든다.
과학자도 시작과 끝만 알고 그 사이 과정을 직접 겪지 않으면, 결과를 전해 듣는 일반인이랑 뭐가 다를까. 그래서 과정이 중요하다고 생각했다.
근데 그 과정마저 AI가 깔끔하게 정리해 주면?
정리된 과정을 읽는 거랑 그 과정을 직접 헤매본 건 아마 다를 거다. 풀이를 읽으면 이해한 것 같은데 막상 혼자 풀면 막히는 것처럼.
그런데 그 차이가 언제까지 의미가 있을지는 솔직히 모르겠다. 생각이 너무 복잡해져서 이건 일단 여기 적어두기만 한다.

## 그래서

AI가 과학자를 대체할지는 모르겠다. 지금 하는 일의 상당 부분은 진짜 바뀔 거다.
다만 무게중심은 옮겨갈 것 같다. 답을 직접 만들어내는 쪽에서, 어떤 문제를 붙잡을지 정하고, 나온 답이 맞는지 따지고, 그 답을 들고 밖에 나갔을 때 그걸 책임지는 쪽으로.

처음 질문으로 돌아가면, 맞긴 맞는데 왜 맞는지 아무도 모르는 답을 과학이라고 할 수 있을까.
지금 생각으로는 그건 과학의 재료는 될 수 있어도 아직 과학은 아닌 것 같다.
누군가 그걸 이해하고 다른 사람한테 설명할 수 있게 됐을 때 그제야 아는 게 하나 늘어나는 거니까.

근데 이것도 그냥 지금 생각이다.
Navier-Stokes 하나만 해도 누구 아이디어였는지, 어디까지가 AI가 한 건지 아직 싸우고 있고, 수학자들끼리도 이걸 반겨야 할지 막아야 할지 의견이 갈린다.
그 와중에 AI는 몇 달 단위로 계속 빨라진다. 작년에 먼 미래 얘기 같던 게 올해 그냥 일어났다.
솔직히 정답은 모르겠다. 아마 지금은 아무도 모르는 것 같다.

그래서 거창한 결론보다는, 잘 적응해야겠다는 생각이 제일 크다.
AI를 피할 수도 없고 피할 생각도 없다. 쓸 수 있는 건 최대한 쓰면서, 그 와중에 내가 직접 붙잡고 있어야 할 게 뭔지 계속 확인하는 수밖에 없을 것 같다.
나도 살길을 찾아봐야겠다.

1년 뒤에 다시 읽으면 생각이 또 바뀌어 있을 거다. 그때 또 적어봐야겠다.

---

## 참고자료

- *OpenAI, 나비에-스토크스 밀레니엄 문제에 관하여 (2026.09.08, 09.10 업데이트). <https://openai.com/ko-KR/index/navier-stokes-solution/>*
- *Clay Mathematics Institute, Navier-Stokes announcement (2026.09.11). <https://www.claymath.org/news/navier-stokes-announcement/>*
- *Z. Lei and X. Ren, Finite-Time Blowup for Navier-Stokes with Smooth Forcing, Part I, arXiv:2609.35406 (2026). <https://arxiv.org/abs/2609.35406>*
- *The Verge, OpenAI just wants to win (2026). <https://www.theverge.com/ai-artificial-intelligence/994255/openai-millennium-prize-problem-tristan-buckmaster-competition>*
- *El Pais, Un ano de trabajo de dos matematicos espanoles frente a 88 horas y 15 millones de OpenAI (2026.09.10). <https://elpais.com/ciencia/2026-09-10/un-ano-de-trabajo-de-dos-matematicos-espanoles-frente-a-88-horas-y-15-millones-de-openai-sin-nuestra-idea-la-ia-no-lo-habria-resuelto.html>*
- *OpenAI, math results repository. <https://github.com/openai/math>*
- *CellCog, OpenAI math results (2026.10.06, updated 10.11). <https://cellcog.ai/blog/openai-math-results/>*
- *T. Feng et al., Semi-Autonomous Mathematics Discovery with Gemini: A Case Study on the Erdos Problems, arXiv:2601.22401 (2026). <https://arxiv.org/abs/2601.22401>*
- *T. Feng et al., Towards Autonomous Mathematics Research, arXiv:2602.10177 (2026). <https://arxiv.org/abs/2602.10177>*
- *Google DeepMind, Accelerating Mathematical and Scientific Discovery with Gemini Deep Think (2026.02.11). <https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/>*
- *Y. Huang, Autonomous disproofs of the sum-product conjecture over R with GPT-5.5 Pro, arXiv:2607.20525 (2026). <https://arxiv.org/abs/2607.20525>*
- *J. Cummings, The Erdos-Sos Conjecture: A visual exposition of the proof discovered by GPT-6 Astra, arXiv:2609.32011 (2026). <https://arxiv.org/abs/2609.32011>*
- *T. Tao et al., A Severe Misalignment of AI in Mathematics (2026.09.11). <https://terrytao.wordpress.com/2026/09/11/a-severe-misalignment-of-ai-in-mathematics/>*
- *T. Tao, Mathematics in the age of AI, arXiv:2608.16753 (2026). <https://arxiv.org/abs/2608.16753>*
- *Business Insider, Math's 'romantic era' is over, UCLA prodigy says (2026.10.19). <https://www.businessinsider.com/math-ai-tools-openai-terence-tao-ucla-2026-10>*
- *M. A. Boden, The Creative Mind: Myths and Mechanisms, 2nd ed. (Routledge, 2004).*
- *Nobel Prize in Chemistry 2026 (Henri B. Kagan, Kenso Soai). <https://www.nobelprize.org/prizes/chemistry/2026/summary/>*
