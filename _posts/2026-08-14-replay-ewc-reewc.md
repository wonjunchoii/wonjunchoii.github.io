---
title: Catastrophic Forgetting과 Replay, EWC, reEWC
date: 2026-08-14 12:00:00 +0900
categories: [AI, Deep Learning]
tags: [continual learning, catastrophic forgetting, fine-tuning, experience replay, ewc, fisher information, reewc, mlip, pytorch, deep learning]
use_math: true
---

이 글은 pretrained 모델을 fine-tuning 할 때 생기는 catastrophic forgetting 문제와, 이를 해결하기 위한 대표적인 방법인 Experience Replay와 Elastic Weight Consolidation(EWC), 그리고 둘을 합친 reEWC를 정리한 문서이다.
마지막에는 이 방법들을 universal machine-learning interatomic potential(MLIP)의 fine-tuning에 적용한 논문을 읽고 정리하였다.

## Motivation

요즘은 모델을 처음부터 학습하기보다는, 대규모 데이터로 미리 학습된 pretrained 모델을 가져와 내 문제에 맞게 fine-tuning 하는 경우가 대부분이다.
소재 분야도 마찬가지로, Materials Project 같은 대규모 DFT 데이터로 학습된 universal MLIP(SevenNet, MACE, CHGNet 등)를 가져와 내가 관심 있는 물질의 데이터로 조금 더 학습시키는 방식이 많이 쓰이고 있다.

그런데 fine-tuning을 해보면 이상한 일이 생긴다.
target 물질에 대한 정확도는 분명히 좋아졌는데, 원래 잘 맞추던 다른 물질들을 갑자기 못 맞추기 시작한다.

> 새로운 것을 배우면, 예전에 알던 것을 잊어버린다.

이 현상을 **catastrophic forgetting**(파국적 망각)이라고 부른다.

pretrained 모델을 쓰는 가장 큰 이유가 넓은 범위에서의 일반화 능력(generalizability)인데, fine-tuning이 그 능력을 망가뜨린다면 pretrained 모델을 쓰는 의미가 사라진다.
특히 소재 탐색처럼 수천 개의 후보 물질을 하나의 모델로 계산해야 하는 경우라면, target 물질 하나만 잘 맞추는 모델은 쓸모가 없다.

### 오래된 문제

사실 catastrophic forgetting은 딥러닝 이전부터 알려진 문제이다.
McCloskey & Cohen(1989)은 신경망에 1이 들어간 한 자리 덧셈 17개(1+1 ~ 9+1, 1+2 ~ 1+9)를 학습시킨 뒤, 이어서 2가 들어간 덧셈 17개를 학습시키는 실험을 하였다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_mccloskey_fig5c.webp" alt="McCloskey and Cohen catastrophic interference" width="500">
  <p>2가 들어간 덧셈(Twos)을 학습하는 동안, 이미 배운 1이 들어간 덧셈(Ones)의 정답률이 무너진다. (McCloskey & Cohen, 1989, Fig. 5C)</p>
</div>

결과는 그림과 같다. 2가 들어간 덧셈을 **단 한 번** 학습했을 뿐인데 1이 들어간 덧셈의 정답률이 100%에서 57%로, 두 번 뒤에는 30%로 떨어졌고, 결국 거의 0%가 되었다.
논문은 이 현상을 **catastrophic interference**라고 불렀다.

사람은 새로운 것을 배워도 예전 기억이 이렇게 한 번에 사라지지 않는다. 그런데 신경망은 왜 이렇게 쉽게 잊어버릴까?

McCloskey & Cohen은 그 원인을 신경망이 지식을 **여러 입력이 공유하는 weight에 분산해서** 저장하기 때문이라고 설명한다.
하나의 weight가 여러 입력에 대한 반응에 동시에 관여하기 때문에, 새로운 입력에 맞게 weight를 바꾸면 이전에 배운 입력에 대한 반응도 함께 바뀌어 버린다.
재미있는 점은, 같은 논문에서 이 weight 공유가 신경망의 **일반화 능력의 원천**이기도 하다고 지적한다는 것이다. 즉, forgetting과 generalization은 동전의 양면이다.

이 문제는 결국 하나의 trade-off로 정리된다.

* Stability (안정성): 기존 지식을 유지하는 능력
* Plasticity (가소성): 새로운 지식을 학습하는 능력

weight를 너무 고정하면 새로운 것을 못 배우고, 너무 자유롭게 두면 예전 것을 잊는다.
이를 **stability-plasticity dilemma**라고 부르며, continual learning 분야는 결국 이 균형을 어떻게 맞출지에 대한 연구라고 할 수 있다.

## Parameter 공간에서 보는 Forgetting

forgetting은 parameter 공간에서 보면 직관적으로 이해할 수 있다. (McCloskey & Cohen도 이미 같은 논문에서 weight 공간 그림으로 이 현상을 설명하였다.)
아래 그림은 parameter가 2개뿐인 toy 문제에서, 실제로 gradient descent를 돌려 fine-tuning 과정을 그린 것이다.

* 파란 영역: pretrained 데이터의 loss가 낮은 영역
* 빨간 점선: fine-tuning 데이터의 loss 등고선
* 별(\\(\theta_{pre}\\)): pretrained parameter, X(\\(\theta_{FT}^{*}\\)): fine-tuning 데이터만의 최적점

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_forgetting.webp" alt="Vanilla fine-tuning trajectory" width="760">
  <p>Vanilla fine-tuning: fine-tuning loss만 보고 움직이면 pretrained 영역을 벗어난다.</p>
</div>

일반적인 fine-tuning(이하 Vanilla)은 fine-tuning loss의 gradient만 따라가기 때문에, \\(\theta_{FT}^{*}\\)를 향해 똑바로 이동한다.
그 결과 fine-tuning loss는 0에 가까워지지만, pretrained loss는 크게 증가한다. 이것이 forgetting이다.

그런데 그림을 다시 보면, 파란 영역과 빨간 영역이 겹치는 부분이 존재한다.
즉, 두 데이터를 **둘 다** 적당히 잘 맞추는 parameter가 분명히 있다는 것이다.
실제 신경망은 parameter 수가 매우 많기 때문에 이런 영역이 존재할 가능성은 더 높다.

문제는 gradient descent가 그런 영역을 찾아갈 이유가 없다는 것이다.
McCloskey & Cohen의 표현을 빌리면, gradient descent는 애초에 "학습할 데이터가 시간에 따라 바뀌는 상황"을 다루도록 설계되지 않았다.
결국 forgetting을 막는다는 것은 다음 질문으로 정리된다.

> fine-tuning 하는 동안 parameter가 **어느 방향으로, 얼마나** 움직이도록 허용할 것인가?

## Continual Learning의 세 가지 접근

forgetting을 완화하는 방법은 크게 세 가지로 나눌 수 있다.

| 접근 방식 | 핵심 아이디어 | 대표 방법 |
|----------|-------------|----------|
| Regularization | 중요한 parameter가 덜 움직이도록 loss에 penalty를 추가 | EWC, SI |
| Replay | 이전 데이터 일부를 같이 학습 | Experience Replay |
| Architectural | task별로 parameter나 모듈을 분리 | Progressive Networks, DEN |

MLIP는 MD 시뮬레이션에서 수백만 번 호출되기 때문에, 모델의 추론 비용이 곧 시뮬레이션 비용이다.
그래서 모델 구조를 키우는 architectural 방법은 잘 맞지 않고, 주로 replay와 regularization이 사용된다.
이 글에서는 이 두 가지를 차례로 살펴본다.

## Experience Replay

### 아이디어

가장 단순하고 직관적인 방법이다.

> 잊어버리는 게 문제라면, 예전 데이터를 가끔 다시 보여주면 된다.

이 아이디어는 뇌과학에서 근거를 찾을 수 있다.
McClelland et al.(1995)의 **Complementary Learning Systems(CLS)** 이론에 따르면, 뇌에는 성격이 다른 두 학습 시스템이 있다.

* 해마(hippocampus): 새로운 경험을 빠르게 저장한다
* 신피질(neocortex): 구조화된 지식을 천천히 학습한다

해마에 저장된 새 기억은 수면 같은 오프라인 상태를 포함해 신피질에서 반복적으로 재현(reinstatement)되고, 신피질은 이를 기존 지식과 **섞어서(interleaved)** 조금씩 학습한다.
왜 이렇게 번거로운 구조가 필요할까? 논문은 신경망 시뮬레이션으로 그 이유를 보여준다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_mcclelland_fig11.webp" alt="Focused vs interleaved learning" width="760">
  <p>새 사실("펭귄은 수영할 수 있다")을 집중 학습(Focused)하면 빨리 배우지만 기존 지식이 크게 손상되고, 기존 데이터와 섞어 학습(Interleaved)하면 느리지만 간섭이 거의 없다. y축은 반전되어 있어 위쪽이 더 좋다. (McClelland et al., 1995, Fig. 11)</p>
</div>

* Focused learning: 새로운 정보만 반복해서 학습 \\(\rightarrow\\) (a) 빨리 배우지만, (b) 기존 지식의 오차가 크게 증가
* Interleaved learning: 새로운 정보를 기존 데이터에 섞어서 학습 \\(\rightarrow\\) (a) 느리게 배우지만, (b) 기존 지식이 거의 유지

즉, 새 기억을 신피질에 바로 새기면 catastrophic interference가 생기기 때문에, 해마가 잠시 보관해 두었다가 기존 지식과 섞어서 천천히 넣어준다는 것이다.
이것이 replay 방법의 직관과 정확히 같다.

### 머신러닝에서의 Replay

머신러닝에서 **experience replay**라는 이름을 처음 쓴 것은 Lin(1992)이다.
강화학습 agent가 과거 경험을 기억해 두었다가 학습 알고리즘에 반복해서 다시 보여주는 방법인데, 흥미롭게도 처음 목적은 forgetting 방지가 아니었다.
시행착오로 얻은 경험을 한 번만 쓰고 버리는 것은 낭비이므로(특히 드물거나 얻기 비싼 경험), 이를 재사용해서 **데이터 효율**을 높이고 학습을 빠르게 하려는 것이었다.

이후 DQN(Mnih et al., 2015)은 최근 100만 개의 경험을 저장해 두고 그중에서 균일하게 샘플링해서 학습하였다.
DQN 논문은 replay의 장점으로 데이터 효율 외에도 연속된 샘플 사이의 상관관계를 없애고 데이터 분포의 급격한 변화를 완화한다는 점을 들며, 해마에서 일어나는 replay와의 연결도 언급한다.

Continual learning에서 replay를 본격적으로 다룬 것은 Rolnick et al.(2019)이다.
먼저 여러 task를 순서대로 학습하면 어떤 일이 생기는지 보자.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_rolnick_fig1.webp" alt="Separate, simultaneous and sequential training" width="760">
  <p>세 가지 DMLab task를 따로(Separate), 동시에(Simultaneous), 순서대로(Sequential) 학습한 결과. 순서대로 학습하면 지금 학습 중이 아닌 task(굵은 선이 학습 중인 구간)의 성능이 바로 무너진다. (Rolnick et al., 2019, Fig. 1)</p>
</div>

Sequential 학습에서 지금 학습 중인 task의 점수는 올라가지만, 이전 task의 점수는 곧바로 떨어지는 톱니 모양이 나타난다.
이 논문이 제안한 **CLEAR**(Continual Learning with Experience And Replay)는 다음과 같이 동작한다.

* 과거 경험을 replay buffer에 저장한다. 기본 설정에서는 버퍼 크기를 제한하고, reservoir sampling으로 지금까지의 경험 전체에서 균일한 샘플을 유지한다
* 새로운 경험과 replay 경험을 50:50으로 섞어서 학습한다
* replay 데이터에는 추가로 behavioral cloning을 적용한다. 과거 정책과 현재 정책 사이의 KL divergence, 과거와 현재 value 출력 사이의 L2 loss를 더해서 과거의 행동을 그대로 유지하도록 한다
* task가 언제 바뀌는지(task boundary)를 알 필요가 없다

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_rolnick_fig2.webp" alt="CLEAR results" width="760">
  <p>같은 순서로 학습하면서 CLEAR를 적용한 결과(왼쪽)와 behavioral cloning을 뺀 결과(오른쪽). replay만으로도 forgetting이 크게 줄어든다. (Rolnick et al., 2019, Fig. 2)</p>
</div>

CLEAR를 적용하면 순서대로 학습해도 동시에 학습한 것과 거의 비슷한 성능이 나온다.
behavioral cloning을 빼도(오른쪽) 일부 흔들림은 있지만 forgetting은 여전히 크게 줄어든다.
또한 버퍼를 전체 경험의 일부만 저장하도록 줄여도 성능이 크게 떨어지지 않았는데, 가장 작은 버퍼(경험 200개 중 1개만 저장)에서만 약간의 forgetting이 나타났다.

### 구현 방식

fine-tuning 상황에서는 pretrained 데이터셋에서 일부를 샘플링해 **Replay set**을 만들고, fine-tuning 중에 이를 함께 학습한다.
구현 방식은 크게 두 가지가 있다.

1. Mixed batch: 하나의 mini-batch 안에 fine-tuning 데이터와 replay 데이터를 섞는다
2. Alternating batch: fine-tuning batch로 한 번 업데이트하고, replay batch로 한 번 더 업데이트한다

뒤에서 다룰 논문은 2번 방식을 사용한다.
fine-tuning batch로 target을 학습한 뒤, 같은 크기의 replay batch로 한 번 더 업데이트해서 pretrained 지식을 복습하는 구조이다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_replay.webp" alt="Experience replay trajectory" width="760">
  <p>Replay: fine-tuning 업데이트와 replay 업데이트를 번갈아 하면서 두 영역이 겹치는 곳으로 이동한다.</p>
</div>

이 그림은 Replay set이 pretrained 데이터를 **잘 대표하는** 이상적인 경우이다. 즉, Replay set에 대한 loss가 pretrained loss(파란 영역)와 같은 모양이다.

그림에서 파란 경로가 지그재그로 움직이는 것을 볼 수 있다.
fine-tuning batch는 \\(\theta_{FT}^{*}\\) 쪽으로, replay batch는 \\(\theta_{pre}\\) 쪽으로 parameter를 당기기 때문이다.
결과적으로 두 영역이 겹치는 곳으로 수렴하고, pretrained loss는 낮게 유지된다.

코드로 쓰면 다음과 같다.

```python
def infinite(loader):
    while True:
        yield from loader

replay_iter = infinite(replay_loader)

for epoch in range(n_epochs):
    for ft_batch in ft_loader:          # 1 epoch = fine-tuning 데이터 1회 순회
        # 1) target 학습
        optimizer.zero_grad()
        loss_fn(model, ft_batch).backward()
        optimizer.step()

        # 2) pretrained 지식 복습
        replay_batch = next(replay_iter)
        optimizer.zero_grad()
        loss_fn(model, replay_batch).backward()
        optimizer.step()
```

보통 Replay set은 fine-tuning set보다 훨씬 크기 때문에, 한 epoch 동안 Replay set의 일부만 보게 된다.
업데이트 횟수가 두 배가 되므로, 학습 비용도 대략 두 배가 된다.

### 문제:

Replay는 간단하고 효과적이지만 몇 가지 한계가 있다.

* parameter가 **얼마나** 움직이는지에는 아무런 제약이 없다
* Replay set의 구성(크기, 다양성)에 따라 성능이 크게 달라진다
* pretrained 데이터에 직접 접근할 수 있어야 하고, 메모리 부담이 있다

첫 번째와 두 번째 문제는 사실 연결되어 있다.
Replay set이 pretrained 데이터 전체를 대표하지 못하면, Replay set이 커버하지 못하는 방향으로는 parameter가 자유롭게 움직여 버린다.
이 문제는 뒤의 reEWC 부분에서 그림으로 다시 확인해 보자.

## Elastic Weight Consolidation (EWC)

### 아이디어

EWC는 DeepMind의 Kirkpatrick et al.(2017)이 제안한 방법으로, 이번에도 뇌과학에서 영감을 받았다.

최근 연구에 따르면 포유류의 신피질에서는 어떤 task를 학습하면 그 task에 대한 지식이 일부 시냅스에 저장되고, 이 시냅스들은 **가소성이 낮아져서** 오랫동안 안정적으로 유지된다고 한다.
이를 synaptic consolidation이라고 부르며, 덕분에 새로운 것을 배워도 중요한 기억은 오래 유지된다.

흥미롭게도 EWC 논문은 replay처럼 이전 데이터를 저장해 두는 방식을 system-level consolidation이라고 부르며, task 수에 비례해서 메모리가 늘어나기 때문에 현실적이지 않다고 지적한다.
그래서 데이터 대신 **weight 자체**를 보호하는 방향을 택했다.

> 모든 weight가 똑같이 중요한 것은 아니다. 이전 task에 중요한 weight는 덜 움직이게 하고, 덜 중요한 weight는 자유롭게 움직이게 하자.

### 왜 L2 regularization으로는 부족한가?

가장 먼저 떠올릴 수 있는 방법은 L2 penalty로 parameter가 pretrained 값에서 멀어지지 않게 하는 것이다.

$$
\mathcal{L}(\theta) = \mathcal{L}_{FT}(\theta) + \frac{\lambda}{2} \sum_i (\theta_i - \theta_{pre,i})^2
$$

하지만 이 방식은 모든 parameter를 똑같은 세기로 묶어 둔다.
EWC는 여기에 parameter별 **중요도** \\(F_i\\)를 곱한다.

$$
\mathcal{L}_{EWC}(\theta) = \mathcal{L}_{FT}(\theta) + \frac{\lambda}{2} \sum_i F_i (\theta_i - \theta_{pre,i})^2
$$

parameter마다 강성(stiffness)이 다른 스프링을 pretrained 값에 매달아 둔 것과 같다. "Elastic"이라는 이름이 여기서 나왔다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_ewc_fig1.webp" alt="EWC schematic" width="520">
  <p>회색은 task A, 노란색은 task B의 오차가 낮은 영역이다. penalty 없이 학습하면(파랑) A를 잊고, 모든 weight를 똑같이 묶으면(L2, 초록) B를 제대로 배우지 못하며, EWC(빨강)는 두 영역이 겹치는 곳으로 이동한다. (Kirkpatrick et al., 2017, Fig. 1)</p>
</div>

원논문의 Fig. 1을 앞에서 사용한 toy 문제로 직접 재현하면 다음과 같다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_l2_vs_ewc.webp" alt="L2 vs EWC trajectory" width="760">
  <p>Vanilla, L2, EWC의 fine-tuning 경로 비교. EWC는 덜 중요한 방향(\(\theta_2\))으로만 움직인다.</p>
</div>

pretrained loss는 \\(\theta_1\\) 방향으로는 매우 가파르고, \\(\theta_2\\) 방향으로는 완만하다.
즉, \\(\theta_1\\)은 중요한 parameter이고, \\(\theta_2\\)는 덜 중요한 parameter이다.

* Vanilla: 아무 제약 없이 \\(\theta_{FT}^{*}\\)로 이동 \\(\rightarrow\\) forgetting이 큼
* L2: 두 방향을 똑같이 묶기 때문에, 중간 어딘가에서 멈춤 \\(\rightarrow\\) 둘 다 애매함
* EWC: \\(\theta_1\\)은 거의 고정하고, \\(\theta_2\\) 방향으로만 이동 \\(\rightarrow\\) pretrained loss를 거의 유지하면서 fine-tuning loss도 줄임

그렇다면 중요도 \\(F_i\\)는 어떻게 구할까?

### Bayesian 관점에서의 유도

EWC는 Bayesian 추론에서 출발한다.
우리가 원하는 것은 pretrained 데이터 \\(D_{pre}\\)와 fine-tuning 데이터 \\(D_{FT}\\)를 모두 본 뒤의 posterior이다.

$$
\log p(\theta \mid D_{pre}, D_{FT}) = \log p(D_{FT} \mid \theta) + \log p(\theta \mid D_{pre}) - \log p(D_{FT} \mid D_{pre})
$$

여기서 핵심은 pretraining의 posterior \\(p(\theta \mid D_{pre})\\)가 fine-tuning 단계에서는 **prior** 역할을 한다는 것이다.
즉, pretrained 데이터에 대한 모든 지식이 이 항 하나에 담겨 있다.

마지막 항은 \\(\theta\\)와 무관하므로, posterior를 최대화하는 것은 다음을 최소화하는 것과 같다.

$$
\mathcal{L}(\theta) = -\log p(D_{FT} \mid \theta) - \log p(\theta \mid D_{pre})
$$

* 첫 번째 항: 일반적인 fine-tuning loss
* 두 번째 항: pretrained 지식을 유지하도록 하는 항

문제는 두 번째 항이다. 딥러닝 모델에서 \\(p(\theta \mid D_{pre})\\)를 정확히 계산하는 것은 불가능하다.
그래서 EWC는 Laplace approximation을 이용해, 이 posterior를 \\(\theta_{pre}\\)를 평균으로 하는 **가우시안**으로 근사한다.

이를 Taylor 전개 관점에서 보면 다음과 같다. \\(\theta_{pre}\\) 근처에서 2차까지 전개하면,

$$
-\log p(\theta \mid D_{pre}) \approx \text{const} + \frac{1}{2} (\theta - \theta_{pre})^\top H \, (\theta - \theta_{pre})
$$

* \\(\theta_{pre}\\)는 pretraining의 최적점이므로 1차 항(gradient)은 0이 되어 사라진다
* \\(H\\)는 \\(\theta_{pre}\\)에서의 Hessian, 즉 loss landscape의 **곡률**이다

곡률이 크다는 것은 그 방향으로 조금만 움직여도 loss가 크게 증가한다는 뜻이다.
위 그림에서 \\(\theta_1\\) 방향이 바로 곡률이 큰 방향이다.

### Hessian 대신 Fisher Information

하지만 수백만 개의 parameter를 가진 모델에서 Hessian은 계산할 수도, 저장할 수도 없다.
그래서 EWC는 가우시안의 precision(공분산의 역행렬)으로 **Fisher Information Matrix(FIM)**의 대각 성분을 사용한다.

$$
F_{ij} = \mathbb{E}\left[ \frac{\partial \log p(D \mid \theta)}{\partial \theta_i} \frac{\partial \log p(D \mid \theta)}{\partial \theta_j} \right]
$$

왜 하필 Fisher일까? 원논문은 Fisher의 세 가지 성질을 이유로 든다.

1. 최소점 근처에서 loss의 2차 미분과 같다 (즉, Hessian 대신 쓸 수 있다)
2. **1차 미분(gradient)만으로** 계산할 수 있어서, 큰 모델에서도 계산하기 쉽다
3. 항상 positive semi-definite이다

여기에 실제로 쓰기 위한 근사가 더해진다.

* 대각 근사: off-diagonal 항을 무시하고 \\(F_{ii}\\)만 사용한다. parameter 수가 \\(n\\)일 때 \\(O(n^2)\\)이던 메모리가 \\(O(n)\\)으로 줄어든다
* loss로 대체: log-likelihood 대신 실제 학습에 쓰는 loss 함수의 gradient를 사용한다 (empirical Fisher)

결과적으로 parameter \\(i\\)의 중요도는 pretrained 데이터에 대한 **gradient 제곱의 평균**이 된다.

$$
F_i = \frac{1}{N} \sum_{x \in D_{pre}} \left( \frac{\partial \mathcal{L}(\theta; x)}{\partial \theta_i} \Bigg|_{\theta = \theta_{pre}} \right)^2
$$

### 직관:

* \\(F_i\\)가 크다 \\(\rightarrow\\) 이 parameter가 바뀌면 pretrained 데이터의 loss가 크게 변한다 \\(\rightarrow\\) 강하게 고정
* \\(F_i\\)가 작다 \\(\rightarrow\\) 이 parameter는 pretrained 성능에 거의 영향이 없다 \\(\rightarrow\\) 자유롭게 학습

원논문은 이 방법을 permuted MNIST(task마다 입력 픽셀 순서를 다르게 섞은 MNIST)와 Atari 게임 여러 개를 순서대로 학습하는 문제에 적용하였다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_ewc_fig2a.webp" alt="EWC permuted MNIST" width="460">
  <p>Permuted MNIST에서 task A, B, C를 순서대로 학습한 결과. SGD는 이전 task를 잊고, L2는 새 task를 잘 배우지 못하며, EWC는 둘 다 유지한다. (Kirkpatrick et al., 2017, Fig. 2A)</p>
</div>

toy 문제에서 본 것과 같은 결과가 실제 신경망에서도 나타난다.
참고로 task가 3개 이상이면, task마다 Fisher를 계산해서 penalty를 하나씩 더하면 된다. 2차 함수의 합은 다시 2차 함수이므로 하나의 penalty로 합칠 수도 있다.

### PyTorch 구현

```python
import torch

class EWC:
    def __init__(self, model, fisher_loader, loss_fn, lam):
        self.lam = lam
        self.params_pre = {
            n: p.detach().clone()
            for n, p in model.named_parameters() if p.requires_grad
        }
        self.fisher = self._compute_fisher(model, fisher_loader, loss_fn)

    def _compute_fisher(self, model, loader, loss_fn):
        fisher = {n: torch.zeros_like(p) for n, p in self.params_pre.items()}
        n_samples = 0
        for sample in loader:                 # batch_size=1: 샘플별 gradient 제곱
            model.zero_grad()
            loss_fn(model, sample).backward()
            for n, p in model.named_parameters():
                if n in fisher and p.grad is not None:
                    fisher[n] += p.grad.detach() ** 2
            n_samples += 1
        return {n: f / n_samples for n, f in fisher.items()}

    def penalty(self, model):
        loss = 0.0
        for n, p in model.named_parameters():
            if n in self.fisher:
                loss = loss + (self.fisher[n] * (p - self.params_pre[n]) ** 2).sum()
        return 0.5 * self.lam * loss
```

구현할 때 주의할 점은 다음과 같다.

* Fisher는 **샘플별** gradient를 제곱한 뒤 평균을 내야 한다. batch 평균 gradient를 제곱하면 \\((\mathbb{E}[g])^2\\)를 계산하게 되는데, 최적점 근처에서는 평균 gradient가 거의 0이므로 Fisher도 거의 0이 되어 버린다
* Fisher는 fine-tuning 전에 **한 번만** 계산해 두고 재사용한다
* \\(F_i\\) 값의 scale이 매우 작기 때문에, \\(\lambda\\)는 보통 매우 큰 값이 된다. penalty 항이 fine-tuning loss와 비슷한 크기가 되도록 맞추는 것이 출발점이다

### 문제:

* fine-tuning 중에는 pretrained 데이터를 보지 않기 때문에, 업데이트 **방향**은 여전히 fine-tuning 데이터만 보고 결정된다
* 대각 근사 때문에 parameter 사이의 상관관계를 무시한다. 여러 parameter가 동시에 조금씩 움직이면, 각각은 작은 변화라도 합쳐서 큰 forgetting이 생길 수 있다
* Laplace approximation은 \\(\theta_{pre}\\) **근처**에서만 정확하다. parameter가 멀리 이동하면 2차 근사 자체가 맞지 않게 된다

참고로 위 toy 문제는 loss가 정확히 2차 함수이고 Fisher도 정확하게 계산했기 때문에, EWC가 이상적으로 동작하는 경우이다.
실제 신경망에서는 위의 근사들 때문에 이렇게 깔끔하게 동작하지 않는다.

## reEWC: Replay + EWC

여기까지 보면 두 방법의 장단점이 정확히 반대라는 것을 알 수 있다.

| | Replay | EWC |
|---|---|---|
| 업데이트 방향 | pretrained 데이터가 직접 안내 | fine-tuning 데이터만 봄 |
| 업데이트 크기 | 제약 없음 | Fisher로 제한 |

이렇기에, 자연스럽게 "Replay로 방향을 잡고, EWC로 크기를 제한하면 어떨까?" 라는 아이디어로 이어진다.

이것이 **reEWC**이다.
구현도 간단하다. Replay의 alternating mini-batch 학습을 그대로 쓰되, 모든 업데이트의 loss에 EWC penalty를 더하면 된다.

$$
\mathcal{L}_{reEWC}(\theta; B) = \mathcal{L}(\theta; B) + \frac{\lambda}{2} \sum_i F_i (\theta_i - \theta_{pre,i})^2, \quad B \in \{ B_{FT}, B_{replay} \}
$$

```python
ewc = EWC(model, fisher_loader, loss_fn, lam=1e5)
replay_iter = infinite(replay_loader)

for epoch in range(n_epochs):
    for ft_batch in ft_loader:
        for batch in (ft_batch, next(replay_iter)):
            optimizer.zero_grad()
            loss = loss_fn(model, batch) + ewc.penalty(model)
            loss.backward()
            optimizer.step()
```

추가되는 비용은 penalty 계산뿐이므로, 학습 비용은 Replay와 거의 같다.

### 왜 시너지가 나는가?

Replay의 두 번째 문제였던 "Replay set이 pretrained 데이터를 대표하지 못하는 경우"를 toy 문제로 확인해 보자.
앞의 Replay 그림과 방법은 똑같고, **Replay set만** 바꾸었다.
앞에서는 Replay set이 pretrained 데이터를 잘 대표했다면, 아래 그림은 Replay set이 \\(\theta_1\\) 방향을 약하게만 제약하도록 일부러 편향시킨 경우이다.
(예를 들어, 특정 원소를 포함한 구조만으로 Replay set을 구성한 상황을 생각하면 된다.)

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_biased_replay.webp" alt="Biased replay set: Replay vs reEWC" width="760">
  <p>편향된 Replay set을 쓰면 Replay 단독(청록)은 중요한 방향(\(\theta_1\))으로 크게 이동하지만, reEWC(보라)는 Fisher가 이를 막아준다. 연한 파란 점선은 앞에서 본, 대표성 있는 Replay set을 쓴 Replay의 경로이다.</p>
</div>

청록색 점선은 편향된 Replay set의 loss가 낮은 영역이다. 실제 pretrained loss(파란 영역)보다 \\(\theta_1\\) 방향으로 훨씬 넓게 퍼져 있는데, 이것이 "Replay set이 \\(\theta_1\\)을 약하게만 붙잡는다"는 의미이다.

* Replay(편향된 set): Replay set 입장에서는 \\(\theta_1\\)이 커져도 loss가 별로 늘지 않으므로, \\(\theta_1\\) 방향으로 크게 이동한다 \\(\rightarrow\\) 실제 pretrained loss가 크게 증가
* reEWC(같은 편향된 set): Fisher는 **전체** pretrained 데이터로 계산했기 때문에, \\(\theta_1\\)이 중요하다는 정보를 갖고 있다 \\(\rightarrow\\) \\(\theta_1\\)은 고정되고 \\(\theta_2\\) 방향으로만 이동

즉, 두 방법은 서로의 약점을 보완한다.

* EWC의 약점(방향) \\(\rightarrow\\) Replay set이 pretrained 데이터 쪽으로 업데이트 방향을 틀어준다
* Replay의 약점(크기, Replay set 의존성) \\(\rightarrow\\) Fisher penalty가 중요한 parameter의 큰 이동을 막는다

## Application: Universal MLIP의 forgetting-aware fine-tuning

이제 위 방법들을 실제 문제에 적용한 논문을 살펴보자.

> J. Kim, J. Lee *et al.*, "An efficient forgetting-aware fine-tuning framework for pretrained universal machine-learning interatomic potentials", *npj Computational Materials* 12, 26 (2026).

### 배경: Pretrained MLIP의 PES softening

MLIP는 원자 구조를 입력받아 DFT 수준의 에너지와 힘을 예측하는 모델이다.
[이전 글](../message-passing-neural-network)에서 정리한 message passing 기반 GNN 구조가 주로 사용되며, MPtrj 같은 대규모 데이터로 학습한 모델을 universal MLIP(uMLIP)라고 부른다.

uMLIP는 놀라운 transferability를 보여주지만, Deng et al.(2025)이 체계적으로 보고한 문제가 하나 있다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_deng_fig1.webp" alt="PES softening schematic" width="760">
  <p>uMLIP의 PES softening. 사전학습 데이터(주황)가 몰려 있는 평형 근처는 잘 맞추지만, 에너지가 높은 영역(빨강)에서는 에너지와 힘을 체계적으로 과소평가해서 PES가 평평해진다. (Deng et al., 2025, Fig. 1, CC BY 4.0)</p>
</div>

* uMLIP의 학습 데이터는 대부분 Materials Project의 구조 최적화(relaxation) 경로에서 나온 것이라, **PES의 최소점 근처**에 몰려 있다
* 그래서 에너지가 높은 구조의 에너지와 힘을 체계적으로 과소평가한다. 이를 **PES softening**이라고 부른다
* Deng et al.은 M3GNet, CHGNet, MACE-MP-0 세 모델 모두에서 표면 에너지, 점결함 에너지, 고용체 혼합 에너지, 이온 이동 장벽, phonon 진동수가 일관되게 과소평가되는 것을 확인하였다

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_deng_fig5.webp" alt="Softening scale" width="760">
  <p>(a) 고온 MD로 샘플링한 구조에서 uMLIP 힘 vs DFT 힘. 기울기(softening scale)가 모두 1보다 작다. (b) 1000개 화합물의 softening scale 분포. 93~98%의 물질에서 1보다 작다. (Deng et al., 2025, Fig. 5, CC BY 4.0)</p>
</div>

Deng et al.은 softening 정도를 **softening scale**로 정량화하였는데, 고온 MD로 샘플링한 고에너지 구조에서 uMLIP 힘과 DFT 힘의 parity plot을 그렸을 때의 기울기이다.
1보다 작으면 softening, 1보다 크면 stiffening이다.
뒤에서 볼 reEWC 논문은 같은 방식으로 에너지에 대해서도 softening scale을 계산한다.

이동 장벽이 낮게 예측되면 이온이 실제보다 쉽게 움직이기 때문에, Li 고체 전해질(SSE)에서는 Li 확산도를 과대평가하게 된다.
Deng et al.은 이 softening이 체계적인 오차이기 때문에 적은 양의 고에너지 데이터만으로도 상당 부분 고칠 수 있다고 보였다.
그래서 fine-tuning이 자연스러운 해결책이 되지만, 앞에서 본 것처럼 forgetting이 따라온다.
reEWC 논문은 이를 해결하기 위해 Vanilla, Replay, EWC, reEWC를 체계적으로 비교하였다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig1.webp" alt="Forgetting prevention strategies" width="560">
  <p>(a) parameter 공간에서 본 catastrophic forgetting. (b) EWC: pretrained 데이터로 계산한 Fisher로 중요한 parameter의 변화를 억제한다. (c) Replay: 매 iteration마다 fine-tuning set과 Replay set(MPtrj에서 샘플링)에서 batch를 하나씩 뽑아 학습한다. (Kim et al., 2026, Fig. 1, CC BY-NC-ND 4.0)</p>
</div>

논문의 개념도도 앞에서 정리한 내용과 같다. (a)는 앞의 toy 그림과 같은 그림이고, (b)와 (c)가 각각 EWC와 Replay이다.

### 실험 설정

| 항목 | 설정 |
|------|------|
| Pretrained 모델 | SevenNet-0 (MPtrj로 학습) |
| Fine-tuning 데이터 | Li<sub>6</sub>PS<sub>5</sub>Cl(LPSC) AIMD 600 K, 1000 K, 총 1000 구조 (train:valid = 9:1) |
| Replay set | MPtrj의 10% 랜덤 샘플 |
| Forgetting 평가 | MPtrj의 또 다른 10% 샘플 (sMPtrj) |
| 비교 방법 | Vanilla, Layer-freezing, Lower LR, Replay, EWC, reEWC |
| 학습 | Adam, 400 epochs, warm-up + cosine annealing, Huber loss |
| \\(\lambda\\) | EWC \\(10^6\\), reEWC \\(10^5\\) |

LPSC는 대표적인 argyrodite형 Li 고체 전해질이다. 이온 전도도가 높아서 짧은 AIMD로도 다양한 Li hopping을 샘플링할 수 있기 때문에 fine-tuning target으로 선택되었다.

### 결과 1: Forgetting과 parameter 이동량

fine-tuning 동안 LPSC validation loss(학습)와 sMPtrj loss(망각)를 함께 추적하면 다음과 같다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig2.webp" alt="Learning and forgetting curves" width="760">
  <p>(a) fine-tuning 중 LPSC fine-tuning set(점선, 학습)과 sMPtrj(실선, 망각)의 total loss. 회색 선은 SevenNet-0의 loss이다. (b) SevenNet-0 parameter로부터의 평균 절대 거리(MAD). (c) parameter에 noise를 더했을 때 sMPtrj 정확도가 유지되는 비율. random noise와 FIM-aware noise를 비교하였다. (Kim et al., 2026, Fig. 2, CC BY-NC-ND 4.0)</p>
</div>

* 모든 방법이 LPSC loss는 잘 낮춘다
* Vanilla, Layer-freezing, Lower LR은 sMPtrj loss가 크게 증가한다
* Replay, EWC, reEWC는 sMPtrj loss를 낮게 유지하고, 특히 reEWC는 SevenNet-0와 거의 같은 수준을 유지한다

흔히 쓰는 "조심스러운 fine-tuning"인 layer-freezing이나 learning rate 낮추기로는 forgetting을 막지 못한다는 점이 흥미롭다.

(a)에서 reEWC(빨강)의 sMPtrj loss는 400 epoch 동안 SevenNet-0의 loss 근처에 머무는 반면, Vanilla(회색)는 계속 증가한다.

pretrained parameter로부터의 평균 절대 거리(MAD, (b))를 함께 보면 더 흥미로운 점이 보인다.

* Vanilla, Replay: parameter가 크게 이동한다 (둘 다 이동량에 제약이 없다)
* Lower LR, EWC, reEWC: 이동량은 비슷하게 작다
* 그런데 Lower LR은 forgetting이 크고, EWC와 reEWC는 forgetting이 작다

Lower LR과 EWC는 parameter를 비슷한 **양**만큼 움직였지만 결과가 다르다.
즉, 얼마나 움직였는지보다 **어떤 parameter를** 움직였는지가 중요하며, 이것이 Fisher의 역할이다.
앞의 L2 vs EWC 그림에서 본 것과 같은 이야기이다.

### 결과 2: Fisher는 정말 중요도를 반영하는가?

이를 확인하기 위해 논문은 SevenNet-0의 parameter에 같은 총량의 Gaussian noise를 두 가지 방식으로 더해 보았다.

* Random noise: 모든 parameter에 균일하게
* FIM-aware noise: \\((F + \lambda I)^{-1}\\)에 비례하게, 즉 중요도가 낮은 parameter에 더 많이

위 Fig. 2(c)를 보면, random noise는 \\(10^{-2}\\) 수준부터 정확도가 급격히 떨어지지만, FIM-aware noise는 \\(10^{-1}\\)까지 정확도를 유지하였다.
inset을 보면 SevenNet-0의 parameter 값은 대부분 -10에서 10 사이에 있으므로, \\(10^{-1}\\) 크기의 변화는 결코 작은 값이 아니다.
Fisher가 "건드리면 안 되는 parameter"를 잘 찾아낸다는 직접적인 증거이다.

### 결과 3: Replay set에 대한 민감도

Replay set을 Li 포함 화합물로만 구성(Li-focused)해서 다양성을 일부러 줄이면,

* Replay 단독: sMPtrj loss가 눈에 띄게 증가한다
* reEWC: 원래 Replay set을 쓴 경우와 거의 차이가 없다

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig3.webp" alt="Sensitivity to replay set" width="420">
  <p>Replay set에 따른 최종 loss. 파랑은 sMPtrj(망각), 빨강은 LPSC fine-tuning validation set(학습)이다. -Li는 Li 포함 화합물만으로 만든 Replay set, -random은 MPtrj에서 랜덤 샘플링한 Replay set이다. (Kim et al., 2026, Fig. 3, CC BY-NC-ND 4.0)</p>
</div>

앞에서 toy 문제로 본 "편향된 Replay set" 그림이 바로 이 상황이다.
OMat24처럼 1억 개 이상의 구조로 학습한 모델에서는 대표성 있는 Replay set을 고르는 것 자체가 어렵기 때문에, 이 robustness는 실용적으로 중요하다.

### 결과 4: Knowledge transfer

평가는 학습에 쓰지 않은 물질들로 진행되었다.

* Argyrodite형 126개 조성 (Li<sub>24+x</sub>M<sub>4</sub>S<sub>20</sub>X<sub>4</sub>, M = Si, Ge, Sn, P, As, Sb / X = Cl, Br, I, 고엔트로피 조성 포함)
* Non-argyrodite 9종: 산화물(LLZO, LATP), 황화물(LGPS, Li<sub>7</sub>P<sub>3</sub>S<sub>11</sub>), 할라이드(Li<sub>3</sub>YCl<sub>6</sub>, Li<sub>3</sub>YBr<sub>6</sub>), 질화물(Li<sub>3</sub>N, Li<sub>9</sub>S<sub>3</sub>N), 수소화물(LiBH<sub>4</sub>)

결과는 다음과 같다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig4.webp" alt="Energy and force accuracy on Li SSEs" width="760">
  <p>Li 고체 전해질 AIMD 데이터에 대한 에너지/힘 정확도. 윗줄(a-d)은 argyrodite형 126개, 아랫줄(e-h)은 non-argyrodite 9개 물질이다. 왼쪽부터 에너지 MAE, 에너지 softening scale, 힘 MAE, 힘 softening scale. 흰색은 SevenNet-0, 회색은 Vanilla, 노랑은 Replay, 주황은 EWC, 빨강은 reEWC이다. (Kim et al., 2026, Fig. 4, CC BY-NC-ND 4.0)</p>
</div>

* SevenNet-0: 에너지와 힘 모두 softening scale < 1
* Vanilla: forgetting 때문에 MAE가 크게 증가
* Replay, EWC, reEWC: SevenNet-0보다 MAE와 softening scale이 오히려 **개선**

LPSC 하나로만 fine-tuning 했는데 다른 물질도 좋아진다는 점이 흥미롭다.
특히 P 비율이 높을수록(PS<sub>4</sub> 사면체를 더 많이 공유할수록) 개선 폭이 컸고, non-argyrodite 중에서도 PS<sub>4</sub> 단위를 가진 LGPS와 Li<sub>7</sub>P<sub>3</sub>S<sub>11</sub>에서 개선이 두드러졌다.
즉, 국소 구조 motif가 비슷하면 지식이 전이된다.

반면 EWC는 질화물, 산화물처럼 LPSC와 화학적으로 먼 물질에서 에너지 MAE가 상대적으로 증가하였다.
다만 힘 MAE는 거의 그대로였는데, 이는 원자 에너지가 거의 일정하게 shift 되었기 때문이다.
pretrained 데이터를 직접 보지 않는 EWC의 한계(방향)가 여기서 드러난다.

### 결과 5: MD에서 드러나는 차이

에너지와 힘 MAE는 snapshot 기준의 평가이다. 실제로 중요한 것은 MD를 돌렸을 때 물성이 맞는지이다.

**Li 확산도**

* SevenNet-0: PES softening 때문에 확산도를 체계적으로 과대평가
* Argyrodite: 모든 fine-tuning 방법이 개선
* Non-argyrodite: Vanilla는 오히려 악화, Replay는 SevenNet-0 수준, EWC는 Replay보다 우수, reEWC가 가장 정확

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig6.webp" alt="Li diffusivity parity plots" width="760">
  <p>MLIP로 계산한 Li 확산도 vs DFT. 윗줄은 argyrodite형 45개, 아랫줄은 non-argyrodite 9개 물질이며, 왼쪽부터 SevenNet-0, Vanilla, Replay, EWC, reEWC이다. 점의 색은 DFT 대비 오차(빨강: 과대평가, 파랑: 과소평가)를 나타낸다. (Kim et al., 2026, Fig. 6, CC BY-NC-ND 4.0)</p>
</div>

SevenNet-0(가장 왼쪽)는 점들이 대각선 위쪽에 몰려 있는데, softening 때문에 확산도를 과대평가하는 것이다.

**Quasi-melting (고온에서 골격이 무너지는 현상)**

일부 argyrodite는 1000 K 이상에서 비-Li 이온이 크게 움직이며 골격이 무너진다. 이 경향을 DFT와 비교하면,

* SevenNet-0: softening 때문에 quasi-melting을 과대 예측
* Vanilla: 고온에서도 안정한 LPSC에 과적합되어 오히려 **stiffening** \\(\rightarrow\\) quasi-melting을 과소 예측
* Replay: 약간 개선되었지만 여전히 과대 예측
* EWC, reEWC: DFT와 가장 잘 일치

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig7.webp" alt="Quasi-melting consistency" width="760">
  <p>DFT와 MLIP의 quasi-melting 비율 비교. 대각선 위는 MLIP가 quasi-melting을 과대 예측(softening), 아래는 과소 예측(stiffening)한 것이다. 왼쪽부터 SevenNet-0, Vanilla, Replay, EWC, reEWC. (Kim et al., 2026, Fig. 7, CC BY-NC-ND 4.0)</p>
</div>

Vanilla가 Li 확산도는 그럴듯하게 맞추면서도 다른 물성은 틀린다는 점이 중요하다.
하나의 물성이 맞는다고 해서 PES 전체가 맞는 것은 아니다.

**Li<sub>3</sub>N에서의 비물리적인 결합**

가장 인상적인 결과이다. Li<sub>3</sub>N으로 MD를 돌리면,

* Vanilla: DFT에서는 일어나지 않는 N 확산이 나타나고, 약 1 \\(\mathring{\mathrm{A}}\\)의 비물리적인 Li-Li 결합이 생긴다
* Replay도 비물리적인 Li-Li 결합을 만든다
* EWC, reEWC: DFT와 일치

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig9.webp" alt="Li3N dynamics" width="760">
  <p>Li<sub>3</sub>N의 1200 K MD 결과. (a) N 원자의 MSD. Vanilla에서만 N이 확산한다. (b) Li-Li RDF. inset의 1 \(\mathring{\mathrm{A}}\) 근처 peak가 Vanilla와 Replay에서 나타나는 비물리적인 Li-Li 결합이다. (c) 각 모델의 MD 경로에서 뽑은 구조의 에너지를 DFT(파랑)와 MLIP(주황)로 계산한 결과. (Kim et al., 2026, Fig. 9, CC BY-NC-ND 4.0)</p>
</div>

(c)가 특히 흥미롭다. Vanilla와 Replay로 돌린 MD에서 뽑은 구조를 DFT로 다시 계산하면, MLIP가 예측한 것보다 에너지가 훨씬 높다.
즉, 이 모델들은 DFT 기준으로는 불안정한 구조를 안정하다고 착각하고, MD가 그쪽으로 흘러간 것이다.

Replay는 sMPtrj loss가 낮았는데도 MD에서는 실패하였다.
앞에서 말한 "parameter 이동량에 제약이 없다"는 한계가 실제로 드러난 사례이다.
test set loss가 낮다고 해서 MD가 안정적이라는 보장은 없으며, parameter 이동을 제한하는 것이 학습 범위 밖의 물질에서의 안정성에 중요하다는 것을 보여준다.

### 결과 6: Parameter 궤적

fine-tuning 중의 parameter 궤적을 PCA로 투영하면 각 방법의 성격이 그대로 드러난다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}reewc_ref_kim_fig10.webp" alt="PCA of parameter trajectories" width="420">
  <p>fine-tuning 중 parameter 궤적의 PCA. 검은 별은 SevenNet-0이고, 10 epoch마다의 parameter를 표시하였다. (Kim et al., 2026, Fig. 10, CC BY-NC-ND 4.0)</p>
</div>

```text
Vanilla : 멀리, fine-tuning 방향으로
Replay  : 멀리, 하지만 Vanilla와 다른 방향으로 (Replay set이 방향을 바꿈)
EWC     : 가까이, 하지만 방향은 fine-tuning 데이터만 보고 결정
reEWC   : 가까이, 그리고 Replay가 방향을 바꿔줌
```

그림에서 EWC(주황)와 reEWC(빨강)는 둘 다 SevenNet-0 근처에 머물지만 향하는 방향이 다르다. EWC 끝점에서 reEWC 끝점으로 그려진 검은 화살표가 바로 Replay set이 바꿔준 방향이라고 볼 수 있다.
앞에서 "Replay는 방향을, EWC는 크기를 담당한다"고 정리한 내용이 실제 parameter 공간에서도 그대로 나타난다.

### 종합 비교

논문의 Table 1을 정리하면 다음과 같다.

| 평가 기준 | Vanilla | Replay | EWC | reEWC |
|----------|---------|--------|-----|-------|
| Forgetting 방지 | Poor | Moderate (Replay set 의존) | Good | Excellent |
| Target 정확도 | Excellent | Excellent | Excellent | Excellent |
| 일반화 (MD 안정성) | Poor | Moderate (불안정한 outlier) | Good | Excellent |
| 학습 비용 | 1배 | 2배 | 1배 | 2배 |

### 실제로 적용할 때 기억할 점

논문에서 얻을 수 있는 실용적인 팁을 정리하면 다음과 같다.

* \\(\lambda\\) 선택: EWC penalty가 전체 학습 loss와 비슷한 scale이 되도록 맞춘다. universal MLIP라면 \\(10^5\\) ~ \\(10^6\\)에서 시작해서, fine-tuning set과 pretrained set의 validation loss를 같이 보며 조정한다
* Fisher 계산 데이터: pretrained 데이터 전체가 아니라, pretrained 모델이 **이미 잘 맞추는** 구조(loss가 낮은 구조)만 골라서 계산한다. 논문에서는 약 115만 개 구조를 사용했고, A100 기준 약 40 GPU-hour가 걸렸다
* Fine-tuning 데이터 선택: pretrained 모델이 **틀리는** 구조를 샘플링해야 효과가 크다. 예를 들어 Li 확산이 느린 Li<sub>6</sub>PS<sub>5</sub>I의 600 K 데이터만으로 학습하면 오히려 stiffening이 생겨 확산도를 과소평가하였다
* Forgetting 위험 예측: target 데이터에 대한 pretrained 모델의 loss가 클수록 parameter가 많이 이동해야 하므로 forgetting 위험이 커진다. fine-tuning 전에 pretrained loss를 먼저 확인해 보는 것이 간단한 진단 방법이 된다
* DFT 설정 호환성: fine-tuning 데이터는 pretrained 데이터와 같은 DFT 설정(exchange-correlation functional 등)으로 만들어야 한다. 설정이 다르면 reEWC도 효과가 없으며, 이 경우 multi-fidelity 모델과 함께 쓰는 것이 대안이다
* 모델 구조와 무관: reEWC는 모델 구조를 바꾸지 않으므로 MACE 계열 모델에도 그대로 적용된다. 여러 target을 동시에 fine-tuning 하거나, 순차적으로 반복해서 fine-tuning 하는 것도 가능하다

## 핵심 요약

| 방법 | 핵심 아이디어 | 제어하는 것 | 한계 |
|------|-------------|-----------|------|
| Vanilla | 새 데이터로 계속 학습 | 없음 | Catastrophic forgetting |
| Replay | 이전 데이터를 함께 학습 | 업데이트 방향 | 이동량 제약 없음, Replay set 의존 |
| EWC | Fisher로 가중한 L2 penalty | 업데이트 크기 | 방향은 새 데이터만 봄, 대각/2차 근사 |
| reEWC | Replay + EWC | 방향과 크기 모두 | Replay 수준의 학습 비용 |

## 한 문장으로 요약

Fine-tuning에서 forgetting을 막는다는 것은 parameter가 **어느 방향으로(Replay), 얼마나(EWC)** 움직일지를 제어하는 문제이며, reEWC는 이 두 가지를 동시에 제어해서 target 정확도와 일반화 능력 사이의 균형을 맞춘다.

---

## 참고자료

- *J. Kim, J. Lee et al., An efficient forgetting-aware fine-tuning framework for pretrained universal machine-learning interatomic potentials, npj Comput. Mater. 12, 26 (2026). <https://doi.org/10.1038/s41524-025-01895-w>*
- *SevenNet-reEWC: <https://github.com/kskjs1203/SevenNet-reEWC>*
- *J. Kirkpatrick et al., Overcoming catastrophic forgetting in neural networks, PNAS 114, 3521 (2017). <https://doi.org/10.1073/pnas.1611835114>*
- *D. Rolnick et al., Experience Replay for Continual Learning, NeurIPS (2019). <https://arxiv.org/abs/1811.11682>*
- *M. McCloskey and N. J. Cohen, Catastrophic interference in connectionist networks: The sequential learning problem, Psychology of Learning and Motivation 24, 109 (1989). <https://doi.org/10.1016/S0079-7421(08)60536-8>*
- *J. L. McClelland, B. L. McNaughton and R. C. O'Reilly, Why there are complementary learning systems in the hippocampus and neocortex, Psychological Review 102, 419 (1995). <https://doi.org/10.1037/0033-295X.102.3.419>*
- *L.-J. Lin, Self-improving reactive agents based on reinforcement learning, planning and teaching, Machine Learning 8, 293 (1992). <https://doi.org/10.1007/BF00992699>*
- *V. Mnih et al., Human-level control through deep reinforcement learning, Nature 518, 529 (2015). <https://doi.org/10.1038/nature14236>*
- *B. Deng et al., Systematic softening in universal machine learning interatomic potentials, npj Comput. Mater. 11, 9 (2025). <https://doi.org/10.1038/s41524-024-01500-6>*
