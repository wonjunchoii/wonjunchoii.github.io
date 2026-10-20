---
title: Knowledge Distillation
date: 2026-09-18 12:00:00 +0900
categories: [AI, Deep Learning]
tags: [knowledge distillation, teacher-student, model compression, soft target, temperature, mlip, sevennet, pytorch, deep learning]
use_math: true
---

## 증류(Distillation)

최근 AI 업계에서 "증류"를 두고 논란이 이어지고 있다.
Anthropic은 올해 2월 중국 AI 기업들이 수만 개의 부정 계정으로 Claude에 질문을 대량으로 던지고, 그 답변으로 자기 모델을 학습시켰다고 공개했다.
이후 미국 정부 기관들도 "산업적 규모의 악의적 증류"라는 표현을 쓰며 권고문을 냈고, 9월에는 Anthropic이 더 구체적인 사례를 담은 보고서를 내놓았다.

재미있는 건 양쪽의 입장이다.
Anthropic은 증류 자체는 널리 쓰이는 정당한 학습 방법이라고 하면서도, 허가 없이 부정 계정으로 경쟁사 모델의 능력을 빼내는 건 "증류 공격"이라고 본다.
반면 중국 상무부는 증류가 전 세계 AI 업계가 쓰는 통상적인 기술일 뿐인데 미국이 이를 정치화하고 있다고 반박했고, 미국 기업들도 중국 모델을 증류하고 있다고 맞섰다.
결국 둘 다 기술 자체는 문제가 없다고 보는데, 그걸 어떻게 썼느냐를 두고 부딪히고 있는 셈이다.

여기서 말하는 증류는 남의 AI에 질문을 대량으로 던지고, 돌아온 답변을 교재 삼아 자기 모델을 학습시키는 방식이다.
사실 이 아이디어 자체는 꽤 오래됐다. 2006년에 나온 Model Compression도 거의 같은 구조이고, 요즘 MLIP 쪽에서도 같은 방식으로 가벼운 모델을 만들고 있다.
그래서 이번 기회에 증류가 어떤 기술인지 처음부터 정리해 보았다.

## Motivation

모델은 클수록 잘 맞춘다. 하지만 클수록 느리다.

[이전 글](../gnn-mlip-to-universal-mlip)에서 다룬 universal MLIP도 마찬가지이다.
수십 개의 데이터셋, 수억 개의 구조로 학습한 foundation model은 분자, 결정, 표면을 가리지 않고 DFT에 가까운 정확도를 보여준다.
그런데 이런 모델은 parameter 수가 수천만 개에 달하고, 고차 equivariant feature와 깊은 message passing layer를 쓰기 때문에 MD 시뮬레이션이 느리고 메모리도 많이 먹는다.
수만 개 원자로 나노초 단위의 MD를 돌려야 하는 실제 연구에서는 이 비용이 그대로 병목이 된다.

그렇다면 작은 모델을 쓰면 되지 않을까?
문제는 작은 모델을 같은 데이터로 **처음부터** 학습하면 정확도와 일반화 능력이 크게 떨어진다는 것이다.

여기서 질문을 하나 던져볼 수 있다.

> 작은 모델은 표현력이 부족해서 못 배우는 걸까, 아니면 배우는 방법이 문제일까?

knowledge distillation은 후자에 걸어보는 방법이다.
작은 모델도 **잘 가르치면** 큰 모델이 배운 것을 상당 부분 따라 할 수 있다는 것이다.

## Model Compression: 시작

distillation의 아이디어는 Bucilua, Caruana, Niculescu-Mizil(2006)의 **Model Compression**에서 출발한다.
당시에는 여러 모델을 합친 ensemble이 가장 정확했지만, 너무 크고 느려서 실제로 쓰기 어려웠다.

이 논문의 아이디어는 단순하다.

> ensemble에게 라벨이 없는 큰 데이터셋에 라벨을 붙이게 하고, 작은 신경망을 그 라벨로 학습시킨다.

핵심은 **teacher가 무한한 라벨 생성기 역할**을 한다는 것이다.
원래 학습 데이터는 개수가 정해져 있지만, teacher는 어떤 입력이든 라벨을 붙여줄 수 있다.
라벨이 없는 데이터조차 부족한 경우에는 원래 데이터 분포를 흉내 낸 합성 데이터를 만드는 MUNGE라는 방법도 제안하였다.

결과적으로 작은 신경망은 성능 손실이 거의 없으면서도 ensemble보다 1000배 작고 1000배 빨랐다.
이 "teacher가 라벨을 붙여준 데이터로 student를 학습한다"는 구조는 앞의 뉴스에서 본 LLM 증류에서도, 뒤에서 볼 MLIP distillation에서도 그대로 다시 등장한다.

### 얕은 신경망도 깊은 신경망을 따라 할 수 있다

Ba & Caruana(2014)는 여기서 한 발 더 나아가 "Do Deep Nets Really Need to be Deep?"이라는 질문을 던졌다.
얕은 신경망(shallow net)을 정답 라벨이 아니라 깊은 신경망의 출력으로 학습시키면(mimic learning), 같은 parameter 수의 깊은 신경망과 비슷한 성능이 나온다는 것이다.

이 논문에서 흥미로운 점은 teacher의 확률이 아니라 softmax 직전의 값인 **logit**을 L2 loss로 따라 하게 했다는 것이다.

$$
\mathcal{L} = \frac{1}{2T} \sum_t \left\| g(x^{(t)}) - z^{(t)} \right\|^2
$$

왜 확률이 아니라 logit일까? 논문은 다음 예시를 든다.

* logit이 \\([10, 20, 30]\\)이면 softmax 확률은 \\([2 \times 10^{-9}, 4 \times 10^{-5}, 0.9999]\\)이다
* logit이 \\([-10, 0, 10]\\)이어도 softmax 확률은 똑같다
* 하지만 teacher는 내부적으로 이 두 경우를 분명히 다르게 표현하고 있다

즉, softmax를 거치면 teacher가 알고 있던 정보 중 상당 부분이 확률 0 근처로 눌려서 사라진다.
실제로 TIMIT 음성 인식에서 mimic 학습한 얕은 신경망(약 1200만 parameter)은 phone error rate 21.6%로, 같은 크기의 깊은 신경망(21.9%)과 비슷하거나 더 좋았다.
같은 얕은 신경망을 원래 라벨로 학습하면 23.1%였다.

## Hinton의 Knowledge Distillation

**knowledge distillation**이라는 이름은 Hinton, Vinyals, Dean(2015)의 "Distilling the Knowledge in a Neural Network"에서 나왔다.
이 논문은 앞의 아이디어들을 **temperature**라는 하나의 장치로 깔끔하게 정리하였다.

### 틀린 답에도 정보가 있다

분류 모델을 학습할 때 보통은 정답만 1이고 나머지는 0인 one-hot 라벨(hard target)을 쓴다.
그런데 잘 학습된 큰 모델의 출력을 보면, 틀린 클래스에 대한 확률에도 의미 있는 정보가 담겨 있다.

논문의 예시를 빌리면 다음과 같다.

> BMW 사진을 쓰레기 트럭으로 착각할 확률은 매우 작지만, 그래도 당근으로 착각할 확률보다는 훨씬 크다.

즉, "자동차는 트럭과 비슷하고 당근과는 전혀 다르다"는 클래스 사이의 유사도 구조가 틀린 답의 **상대적인 확률** 속에 숨어 있다.
이것이 큰 모델이 어떻게 일반화하는지를 보여주는 정보이며, 흔히 dark knowledge라고 부른다.

문제는 이 확률들이 너무 작다는 것이다. 예를 들어 어떤 숫자 2 이미지가 3일 확률이 \\(10^{-6}\\), 7일 확률이 \\(10^{-9}\\)라고 하자.
두 값의 차이는 1000배이지만, 둘 다 0에 너무 가까워서 cross-entropy loss에는 거의 영향을 주지 못한다.

### Temperature softmax

그래서 Hinton은 softmax에 temperature \\(T\\)를 도입하였다.

$$
q_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}
$$

\\(T = 1\\)이면 일반적인 softmax이고, \\(T\\)를 키울수록 확률 분포가 평평해진다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_temperature.webp" alt="Softmax with temperature" width="620">
  <p>같은 logit이라도 temperature를 올리면 틀린 클래스들 사이의 상대적인 크기가 드러난다.</p>
</div>

\\(T = 1\\)에서는 car가 0.96이고 나머지는 거의 0이다.
\\(T\\)를 올리면 truck > bus > cat > carrot이라는 순서가 확률에서 분명하게 드러난다.
이렇게 높은 temperature에서 얻은 teacher의 확률을 **soft target**이라고 부른다.

### Distillation loss

student는 두 가지 loss를 가중 평균해서 학습한다.

* soft target과의 cross-entropy: teacher와 student 모두 **같은 높은 temperature** \\(T\\)로 계산
* 정답 라벨(hard target)과의 cross-entropy: \\(T = 1\\)로 계산

$$
\mathcal{L} = (1 - \alpha)\, \mathcal{L}_{CE}\left(y, \sigma(z_s)\right) + \alpha\, T^2\, \mathcal{L}_{CE}\left(\sigma(z_t / T), \sigma(z_s / T)\right)
$$

여기서 \\(T^2\\)를 곱하는 이유는, soft target에서 오는 gradient의 크기가 \\(1/T^2\\)에 비례하기 때문이다.
temperature를 바꿔도 두 loss의 상대적인 비중이 유지되도록 보정하는 것이다.
논문은 hard target 쪽에 상당히 작은 가중치를 주는 것이 가장 좋았다고 보고한다.
학습이 끝난 student는 다시 \\(T = 1\\)로 추론한다.

```python
import torch.nn.functional as F

def distillation_loss(student_logits, teacher_logits, labels, T=4.0, alpha=0.9):
    soft = F.kl_div(
        F.log_softmax(student_logits / T, dim=-1),
        F.softmax(teacher_logits / T, dim=-1),
        reduction="batchmean",
    ) * T * T
    hard = F.cross_entropy(student_logits, labels)
    return alpha * soft + (1 - alpha) * hard
```

soft target과의 cross-entropy 대신 KL divergence를 써도 teacher 분포의 entropy만큼 상수 차이가 날 뿐이므로 gradient는 같다.

### Logit matching은 특수한 경우이다

그렇다면 Ba & Caruana의 logit matching과는 어떤 관계일까?
soft target loss를 student의 logit \\(z_i\\)로 미분하면 다음과 같다. (\\(v_i\\)는 teacher의 logit, \\(p_i\\)는 teacher의 soft target이다.)

$$
\frac{\partial \mathcal{L}}{\partial z_i} = \frac{1}{T}\left(q_i - p_i\right)
$$

\\(T\\)가 logit에 비해 충분히 크면 \\(\exp(z_i/T) \approx 1 + z_i/T\\)로 근사할 수 있고, logit의 평균이 0이라고 가정하면 클래스 수 \\(N\\)에 대해

$$
\frac{\partial \mathcal{L}}{\partial z_i} \approx \frac{1}{N T^2}\left(z_i - v_i\right)
$$

가 된다. 즉, **temperature가 매우 높은 극한에서 distillation은 logit 사이의 L2 loss와 같아진다.**
반대로 temperature가 낮으면 평균보다 훨씬 작은(매우 음수인) logit은 덜 신경 쓰게 된다.
temperature는 teacher의 정보 중 어디까지를 student에게 전달할지 정하는 손잡이인 셈이다.

### 결과: 본 적 없는 숫자도 맞춘다

MNIST 실험 결과가 인상적이다.

* 큰 신경망(1200 unit 2층, dropout 사용): test 오류 67개
* 작은 신경망(800 unit 2층)을 그냥 학습: 오류 146개
* 같은 작은 신경망을 \\(T = 20\\)의 soft target으로 학습: 오류 74개

더 흥미로운 실험은 transfer set에서 숫자 **3을 완전히 빼고** distillation한 것이다.
student 입장에서 3은 한 번도 본 적 없는 숫자인데도, 3 클래스의 bias만 조금 조정해 주자 test set의 3 중 98.6%를 맞추었다.
다른 숫자의 soft target 속에 "이 2는 3과 조금 닮았다" 같은 정보가 들어 있었기 때문이다.

음성 인식에서도 10개 모델 ensemble이 얻은 frame 정확도 향상(58.9%에서 61.1%)의 80% 이상을 하나의 distillation 모델(60.8%)이 가져갔다.
또한 데이터를 3%만 썼을 때 hard target으로는 44.5%였지만 soft target으로는 57.0%를 얻어, soft target이 regularizer 역할도 한다는 것을 보여주었다.

## 출력 말고 중간 표현도 따라 하기

Hinton의 distillation은 teacher의 **최종 출력**만 따라 한다.
Romero et al.(2015)의 **FitNets**는 teacher의 **중간 layer 출력**(hint)도 따라 하게 하였다.

$$
\mathcal{L}_{HT} = \frac{1}{2} \left\| u_h(x) - r\left(v_g(x)\right) \right\|^2
$$

* \\(u_h\\): teacher의 hint layer 출력
* \\(v_g\\): student의 guided layer 출력
* \\(r\\): student와 teacher의 feature 차원이 다를 때 둘을 맞춰주는 학습 가능한 regressor

학습은 두 단계로 진행된다. 먼저 student의 guided layer까지를 hint에 맞추도록 pretraining하고, 그다음 전체 network를 일반적인 distillation으로 학습한다.
이 방법으로 CIFAR-10에서 parameter가 약 10.4배 적은 깊고 얇은 student가 teacher보다 더 좋은 성능을 보였다.

이렇게 출력이 아니라 내부 feature를 맞추는 방식을 **feature-based distillation**이라고 부른다.
뒤에서 보겠지만 회귀 문제인 MLIP에서는 이 방식이 특히 중요해진다.

### Student가 teacher를 이길 수도 있다

Furlanello et al.(2018)의 **Born-Again Networks**는 teacher와 **똑같은 크기**의 student를 distillation으로 학습시켰다.
놀랍게도 student가 teacher보다 더 좋은 성능을 보였다.
distillation이 단순히 압축만 하는 것이 아니라, soft target을 통해 더 좋은 학습 신호를 주는 regularization 효과도 있다는 것을 보여주는 결과이다.

## 회귀 문제에서의 Distillation

지금까지는 모두 분류 문제였다. 그렇다면 에너지와 힘을 예측하는 MLIP 같은 **회귀 문제**에서는 어떨까?

Ekstrom Kelvinius et al.(2023)이 지적했듯이, 회귀에는 logit에 해당하는 출력이 없다.
teacher가 내놓는 에너지는 그냥 하나의 숫자이고, temperature로 펼쳐볼 "틀린 답의 분포"도 없다.
그렇다면 회귀에서 teacher가 student에게 줄 수 있는 추가 정보는 무엇일까?

크게 네 가지로 정리할 수 있다.

| 무엇을 전달하는가 | 아이디어 | 대표 연구 |
|----------------|---------|----------|
| 더 많은 라벨 | teacher가 원하는 구조 어디에나 에너지, 힘을 붙여준다 | Model Compression, SevenNet-Nano, LightPFP |
| 원자 에너지 | 전체 에너지 하나 대신, teacher가 계산한 원자별 에너지를 함께 맞춘다 | Matin et al. (2025) |
| 에너지 Hessian | 에너지의 2차 미분(곡률)까지 맞춘다 | Amin et al. (2025) |
| 중간 feature | node, edge feature를 맞춘다 | Ekstrom Kelvinius et al. (2023) |

### 1) Teacher는 무한한 라벨 생성기이다

가장 강력한 것은 첫 번째, Model Compression에서 봤던 아이디어이다.
DFT 계산은 비싸기 때문에 학습 데이터는 항상 부족하고, 특히 계산하기 어려운 영역(에너지가 높은 구조, 원자가 매우 가까운 구조)은 더 부족하다.
반면 teacher가 그런 영역을 잘 알고 있다면, teacher에게 라벨을 붙여달라고 하면 된다.

간단한 1차원 toy 문제로 확인해 보자.
두 원자 사이의 거리에 따른 에너지(PES)를 예측하는 문제이고, 똑같은 작은 student(hidden unit 8개)를 두 가지 방식으로 학습시켰다.

* student (scratch): 평형 거리 근처에서 얻은 DFT 데이터 14개만으로 학습
* student (distilled): 넓은 범위에서 학습한 큰 teacher가 붙여준 라벨 300개로 학습

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_pes_student.webp" alt="Student trained from scratch vs distilled" width="760">
  <p>같은 크기의 student라도 무엇으로 학습했느냐에 따라 결과가 크게 달라진다. 노란 영역이 DFT 데이터가 있는 범위이다.</p>
</div>

두 student는 모델 크기가 완전히 같다. 그런데도 결과는 크게 다르다.

* scratch student: DFT 데이터가 있는 범위 안에서는 잘 맞추지만, 원자가 가까워지는 짧은 거리에서 반발력을 거의 표현하지 못한다
* distilled student: 전체 범위에서 teacher와 거의 같은 곡선을 그린다

즉, 작은 모델의 표현력이 부족했던 것이 아니라 **배울 데이터가 부족했던 것**이다.
뒤의 SevenNet-Nano 논문에서 이와 똑같은 현상이 실제 MLIP에서 나타난다.

### 2) 원자 에너지

MLIP는 보통 전체 에너지를 원자별 에너지의 합으로 예측한다.

$$
E = \sum_i \epsilon_i
$$

DFT는 전체 에너지 \\(E\\)만 알려주지만, teacher MLIP는 원자별 에너지 \\(\epsilon_i\\)도 알려줄 수 있다.
Matin et al.(2025)은 이 원자 에너지를 student 학습에 추가하였다.
구조 하나당 숫자 하나였던 에너지 라벨이 원자 수만큼 늘어나는 셈이다.

그 결과 같은 크기를 teacher 없이 학습한 모델보다 정확도와 속도 모두에서 우월했고, teacher 대비 MD 속도는 2배 이상 빠르고 메모리는 절반 이하이면서 힘 정확도 손실은 20% 이내였다.
teacher와 같은 크기의 student는 오히려 teacher보다 힘 오차가 약 10% 낮았는데, Born-Again Networks와 같은 현상이다.

### 3) 에너지 Hessian

Amin et al.(2025)은 에너지를 원자 좌표로 두 번 미분한 **Hessian**까지 맞추게 하였다.

$$
\mathcal{L} = \mathcal{L}_{EF} + \lambda_{KD} \left\| H_{teacher} + \frac{\partial F_{student}}{\partial r} \right\|^2
$$

힘은 에너지의 1차 미분이므로, 힘을 좌표로 미분하면 Hessian(의 음수)이 된다.
Hessian은 PES의 곡률이므로, 에너지와 힘만으로는 알 수 없는 PES의 모양까지 student에게 전달된다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_amin_fig1.webp" alt="Hessian distillation schematic" width="760">
  <p>Foundation model의 에너지 Hessian을 미리 계산해 두고, 특정 화학 공간에 특화된 작은 MLFF가 이를 따라 하도록 학습한다. (Amin et al., 2025, Fig. 1, CC BY 4.0)</p>
</div>

Hessian 전체를 계산하는 것은 비싸기 때문에, 매 step마다 Hessian의 행 일부만 랜덤하게 뽑아 vector-Jacobian product로 계산한다. 행을 하나만 뽑아도 성능 차이가 거의 없었다고 한다.
이렇게 만든 특화 student는 foundation model보다 최대 20배 빨랐고, 좁은 화학 공간에 모든 표현력을 쓸 수 있기 때문에 오히려 foundation model보다 정확한 경우도 많았다.

### 4) 중간 feature

FitNets의 아이디어를 GNN에 적용한 것이 Ekstrom Kelvinius et al.(2023)이다.
node feature끼리(n2n), edge feature끼리(e2e), 그리고 방향 정보를 담은 vector feature끼리(v2v) 맞추는 방식을 제안하였다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_kelvinius_fig1.webp" alt="KD for molecular GNNs" width="760">
  <p>Feature-based distillation으로 student의 추론 속도는 그대로 유지하면서 teacher와의 정확도 차이를 줄였다. 빨간 화살표가 KD로 줄어든 오차의 비율이다. (Ekstrom Kelvinius et al., 2023, Fig. 1, CC BY 4.0)</p>
</div>

student의 추론 속도를 그대로 유지하면서 teacher와의 에너지 오차 차이를 최대 96.7%, 힘 오차 차이를 최대 62.5%까지 줄였다.
다만 feature matching은 teacher와 student의 구조가 비슷해야 쓰기 쉽다는 단점이 있다. 앞의 Hessian distillation은 구조와 무관하게 쓸 수 있다는 점에서 대비된다.

## Application: SevenNet-Nano

이제 이 아이디어들을 universal MLIP에 적용한 논문을 살펴보자.

> S. Oh, J. You, J. Kim, J. Lee, H. An, S. Han, Y. Kang, "A Lightweight Universal Machine-Learning Interatomic Potential via Knowledge Distillation for Scalable Atomistic Simulations", *J. Chem. Inf. Model.* 66, 8875 (2026).

### 배경: 큰 teacher, SevenNet-Omni

teacher는 SevenNet-Omni(이하 7net-Omni)이다.
무기 결정(MPtrj, Alex, MatPES), 비정질 구조(OMat24), 표면(OC20, OC22), MOF(ODAC23), 분자(SPICE, OMol25, QCML) 등 수많은 데이터셋으로 학습한 multi-task 모델이다.

여기서 중요한 점은 이 데이터셋들이 서로 **다른 DFT 설정**(PBE, r<sup>2</sup>SCAN, hybrid functional 등)으로 계산되었다는 것이다.
그래서 7net-Omni는 계산 설정(fidelity)마다 별도의 출력 채널을 두는 multi-task 구조를 쓴다.
이런 모델은 강력하지만 parameter가 약 2600만 개로 크고 느리다.

반대로 7net-0처럼 MPtrj 하나로만 학습한 작은 모델은 빠르지만, 분자나 표면처럼 학습 범위 밖의 시스템에서 정확도가 떨어지고, [이전 글](../replay-ewc-reewc)에서 본 PES softening 문제도 있다.

### 방법: Teacher로 모든 데이터를 다시 라벨링한다

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_oh_fig1.webp" alt="SevenNet-Nano distillation framework" width="680">
  <p>7net-Omni가 다양한 데이터셋의 구조를 하나의 계산 설정(mpa 채널, PBE)으로 다시 라벨링하고, 작은 7net-Nano가 이를 학습한다. 필요하면 target 시뮬레이션의 구조를 teacher로 라벨링해서 fine-tuning한다. (Oh et al., 2026, Fig. 1)</p>
</div>

방법은 앞에서 본 Model Compression과 같은 구조이다.

1. 7net-Omni의 학습에 쓰인 **모든 데이터셋의 구조**를 가져온다
2. 이 구조들의 에너지, 힘, stress, 원자 에너지를 7net-Omni의 **PBE 채널(mpa) 하나로** 다시 계산한다
3. 작은 7net-Nano를 이 데이터로 학습한다

| | Teacher (7net-Omni) | Student (7net-Nano) |
|---|---|---|
| Parameter 수 | 약 2600만 | 약 10만 5천 |
| 최대 spherical harmonic 차수 \\(l_{max}\\) | 3 | 2 |
| Convolution layer | 5 | 3 |
| Feature 차원 | 128 / 64 / 32 | 32 |

2단계의 의미가 크다. 원래 데이터셋들은 DFT 설정이 제각각이라 하나의 작은 모델로 같이 학습하기 어렵다.
그런데 teacher가 모든 구조를 **같은 계산 설정**으로 다시 라벨링해 주면, 분자 데이터든 표면 데이터든 PBE 기준의 일관된 데이터가 된다.
DFT로는 직접 계산되지 않은 조합(예를 들어 원래 RPBE로 계산된 OC20 구조의 PBE 에너지)까지 teacher가 채워주는 것이다.

loss는 에너지, 힘, stress에 더해 **원자 에너지**까지 포함한다.

$$
\mathcal{L} = \lambda_E \mathcal{L}_E + \lambda_F \mathcal{L}_F + \lambda_S \mathcal{L}_S + \lambda_{AE} \mathcal{L}_{AE}, \quad (\lambda_E, \lambda_F, \lambda_S, \lambda_{AE}) = (1, 1, 2 \times 10^{-4}, 0.5)
$$

앞에서 본 Matin et al.의 아이디어와 같다. 원자 에너지를 함께 맞추면 student와 teacher의 에너지 기준이 일관되게 맞춰진다.
cutoff 반경은 4.5, 5.0, 5.5, 6.0 \\(\mathring{\mathrm{A}}\\) 네 가지로 학습했고(7net-Nano-4.5 등), 데이터가 워낙 많아서 2 epoch만으로 validation 오차가 수렴하였다.

### 결과 1: 다양한 도메인에서의 정확도

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_oh_fig2.webp" alt="Benchmarks across domains" width="760">
  <p>(a) 무기 결정(MatBench Discovery), (b) 결함, (c) 분자, (d) MOF, (e) 표면 반응에 대한 benchmark. 점선은 7net-Omni의 값이다. (Oh et al., 2026, Fig. 2)</p>
</div>

* 무기 결정: 7net-Omni보다는 낮지만, MPtrj로만 학습한 7net-0, MACE-mp-0-small과 비슷하다
* 결함, 분자, MOF, 표면: 7net-0, MACE-mp-0-small보다 확실히 좋다. 예를 들어 grain boundary 에너지 오차는 7net-0의 약 절반이다

student는 parameter가 7net-0과 비슷하거나 더 적은데도, teacher가 학습했던 넓은 도메인의 지식을 물려받은 것이다.
다만 student는 teacher가 만든 라벨로만 학습했으므로 **teacher를 넘어서는 개선은 기대하기 어렵다**. 실제로 대부분의 benchmark에서 7net-Omni보다는 낮았다.
또한 cutoff 반경에 따른 차이는 크지 않았다.

### 결과 2: Li 확산과 PES softening

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_oh_fig4.webp" alt="Li-ion diffusivity" width="760">
  <p>(a-d) 16개 고체 전해질의 Li 확산도: 7net-Omni, 7net-0, 7net-Nano-5.5, fine-tuning한 7net-Nano-5.0. (e-h) 에너지/힘 MAE와 softening scale의 분포. (Oh et al., 2026, Fig. 4)</p>
</div>

| 모델 | MAPE | MPE |
|------|------|-----|
| 7net-Omni (teacher) | 15.4% | 9.1% |
| 7net-0 | 33.8% | 26.1% |
| 7net-Nano-5.5 (student) | 23.4% | 8.9% |

MPE가 크게 양수라는 것은 확산도를 체계적으로 과대평가한다는 뜻이고, 이는 PES softening의 결과이다.
7net-0은 MPE가 26.1%로 softening이 뚜렷하지만, student의 MPE(8.9%)는 teacher(9.1%)와 거의 같다.
즉, 작은 student가 teacher의 **softening이 완화된 PES**까지 물려받았다.
Li<sub>3</sub>YCl<sub>6</sub>의 Li 이동 장벽 계산에서도 7net-0은 DFT보다 12~36 meV 낮게 예측했지만, student에서는 이런 체계적인 과소평가가 보이지 않았다.

student가 특정 물질에서 부족하면 fine-tuning으로 보완할 수 있다.
예를 들어 7net-Nano-5.0은 Li<sub>9</sub>S<sub>3</sub>N에서 MPE가 84.6%로 컸는데, **student 자신의 MD 경로**에서 뽑은 구조를 teacher로 라벨링해서 fine-tuning하자 MPE가 13.6%로 줄었다.
DFT도, teacher의 MD도 필요 없이 student가 만든 구조를 teacher가 채점해 주는 방식이라 비용이 매우 적다.
또한 fine-tuning 데이터의 10%만 써도 teacher 수준의 확산도를 회복했지만, 같은 데이터로 처음부터 학습한 모델은 훨씬 많은 데이터가 필요했다.

### 결과 3: 짧은 거리의 반발력과 plasma etching

가장 인상적인 결과이다.
SiO<sub>2</sub>의 plasma etching 시뮬레이션에서는 수백 eV로 가속된 분자가 표면에 부딪히기 때문에 원자 사이의 거리가 1 \\(\mathring{\mathrm{A}}\\) 아래로 줄어든다.
이때 MLIP가 짧은 거리의 강한 반발력을 제대로 표현하지 못하면 시뮬레이션이 무너진다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_oh_fig8.webp" alt="Short-range repulsion" width="560">
  <p>(a) CF 분자의 F 원자를 표면 Si 원자 쪽으로 끌어당기는 계산. (b) 거리에 따른 에너지. 7net-0(초록)은 0.8 \(\mathring{\mathrm{A}}\) 아래에서 에너지가 급격히 음수로 떨어진다. (c, d) 7net-Omni와 7net-Nano-5.5의 반발 에너지 vs DFT. (Oh et al., 2026, Fig. 8)</p>
</div>

* 7net-0: 약 0.8 \\(\mathring{\mathrm{A}}\\) 아래에서 에너지가 갑자기 음수로 떨어진다. 원자가 서로 붙을수록 안정해진다는 비물리적인 결과이므로 etching 시뮬레이션에 쓸 수 없다
* 7net-Omni: DFT의 반발 에너지를 잘 재현한다 (\\(R^2 = 0.945\\))
* 7net-Nano: teacher보다는 조금 떨어지지만 반발력을 잘 재현한다 (\\(R^2 = 0.871\\))

앞의 toy 문제와 정확히 같은 상황이다.
7net-0의 학습 데이터(MPtrj)에는 원자가 매우 가까운 구조가 거의 없어서 짧은 거리를 배울 수 없었다.
반면 teacher는 그런 고에너지 구조를 포함한 OMat24로 학습했고, distillation 과정에서 그 지식이 작은 student에게 그대로 전달되었다.

etching 시뮬레이션에서 fine-tuning을 할 때는 [이전 글](../replay-ewc-reewc)에서 다룬 replay도 사용하였다.
fine-tuning 데이터와 pretrained 데이터(OMat24, MPtrj, SPICE 등에서 샘플링)를 1:20 비율로 섞어 학습했는데, replay 없이 fine-tuning한 모델은 짧은 거리의 반발력을 잃어버리고 비물리적인 구조를 만들었다.
student가 teacher에게 물려받은 지식도 catastrophic forgetting으로 쉽게 잃어버릴 수 있다는 것이다.

### 결과 4: 속도

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_oh_fig11.webp" alt="Throughput and speedup" width="420">
  <p>(a) 원자 수에 따른 MD 속도(ns/day). (b) 7net-Omni 대비 속도 향상. 비정질 SiO<sub>2</sub>, NVIDIA RTX PRO 6000 GPU 기준. (Oh et al., 2026, Fig. 11)</p>
</div>

* 1000개 이하의 작은 시스템: 7net-Omni보다 약 2.7배 빠르다
* 10000개 이상의 큰 시스템: cutoff에 따라 9.5~20.5배 빠르다
* 7net-Omni는 약 15000개 원자를 넘으면 GPU 메모리가 부족했지만, 7net-Nano는 70000개 원자까지 돌릴 수 있었다

큰 시스템에서 차이가 더 커지는 것은 student의 메모리 사용량이 훨씬 적기 때문이다.
덕분에 teacher로는 돌릴 수 없었던 9 nm<sup>2</sup> 크기의 etching 시뮬레이션도 수행할 수 있었고, 그 결과 실험값과 더 잘 맞는 etching yield를 얻었다.

### Distillation의 먹이사슬

LightPFP 논문(Li et al., 2025)은 이 흐름을 "먹이사슬"로 표현한다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}kd_ref_lightpfp_fig1.webp" alt="Food chain of atomistic calculation methods" width="620">
  <p>원자 수준 계산 방법의 "먹이사슬". 아래 단계의 결과를 위 단계가 학습하면서, 정확도를 조금씩 잃는 대신 속도와 시스템 크기를 얻는다. (Li et al., 2025, Fig. 1, CC BY 4.0)</p>
</div>

양자역학의 정확한 방법에서 DFT로, DFT에서 universal MLIP로, 그리고 universal MLIP에서 가벼운 student로.
한 단계씩 올라갈 때마다 약간의 정확도를 내주고 훨씬 큰 속도와 시스템 크기를 얻는다.
LightPFP는 MTP라는 descriptor 기반의 매우 빠른 student를 쓰는 대신 target 시스템마다 fine-tuning이 필요하고, SevenNet-Nano는 GNN student를 써서 fine-tuning 없이도 넓은 범위에서 쓸 수 있다는 차이가 있다.

### 실제로 적용할 때 기억할 점

* student는 teacher를 넘기 어렵다. teacher의 오차와 편향(예: DFT 설정의 한계)도 함께 물려받는다
* 대신 teacher가 아는 영역이라면, DFT 데이터가 부족한 영역(짧은 거리, 고에너지 구조)까지 student에게 전달할 수 있다
* 서로 다른 계산 설정으로 만들어진 데이터셋을 teacher가 하나의 설정으로 통일해 줄 수 있다
* 원자 에너지처럼 teacher만 줄 수 있는 추가 정보를 함께 쓰면 좋다
* 특정 시스템에서 부족하면, student의 MD에서 구조를 뽑아 teacher로 라벨링해서 fine-tuning한다. 이때 forgetting을 막기 위해 replay를 함께 쓰는 것이 안전하다
* validation 오차가 낮다고 MD가 안정적인 것은 아니다. 짧은 거리처럼 시뮬레이션에서 실제로 마주칠 구조를 따로 확인해야 한다

## 핵심 요약

| 방법 | 전달하는 것 | 핵심 아이디어 |
|------|-----------|-------------|
| Model Compression (2006) | 더 많은 라벨 | teacher가 라벨 없는 데이터에 라벨을 붙인다 |
| Mimic learning (2014) | logit | softmax 전의 값을 L2로 따라 한다 |
| Hinton KD (2015) | soft target | temperature로 틀린 답의 정보를 드러낸다 |
| FitNets (2015) | 중간 feature | hint layer를 regressor로 맞춘다 |
| MLIP distillation | 라벨, 원자 에너지, Hessian, feature | 회귀에는 logit이 없으므로 teacher만 줄 수 있는 정보를 찾는다 |

## 한 문장으로 요약

Knowledge distillation은 작은 모델이 못 배우는 것이 아니라 **배울 신호가 부족했다**는 관점에서 출발하며, teacher가 더 많은 라벨과 더 풍부한 정보(soft target, 원자 에너지, Hessian, feature)를 제공해서 작은 student가 큰 모델의 지식을 물려받게 하는 방법이다.

---

## 참고자료

- *Anthropic, Detecting and preventing distillation attacks (2026.02.23). <https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks>*
- *KBS, 중국은 미국의 AI를 훔쳤을까?...'증류' 논쟁 (2026.09.10). <https://news.kbs.co.kr/news/pc/view/view.do?ncd=8660002>*
- *한겨레, 앤트로픽 "알리바바, 클로드에 1억5100만번 접근"...중국 '악의적 증류' 사례 공개 (2026.09.11). <https://www.hani.co.kr/arti/international/china/1277437.html>*
- *S. Oh et al., A Lightweight Universal Machine-Learning Interatomic Potential via Knowledge Distillation for Scalable Atomistic Simulations, J. Chem. Inf. Model. 66, 8875 (2026). <https://doi.org/10.1021/acs.jcim.6c01103>*
- *C. Bucilua, R. Caruana and A. Niculescu-Mizil, Model Compression, Proc. 12th ACM SIGKDD, 535 (2006). <https://doi.org/10.1145/1150402.1150464>*
- *L. J. Ba and R. Caruana, Do Deep Nets Really Need to be Deep?, NeurIPS (2014). <https://arxiv.org/abs/1312.6184>*
- *G. Hinton, O. Vinyals and J. Dean, Distilling the Knowledge in a Neural Network, arXiv:1503.02531 (2015). <https://arxiv.org/abs/1503.02531>*
- *A. Romero et al., FitNets: Hints for Thin Deep Nets, ICLR (2015). <https://arxiv.org/abs/1412.6550>*
- *T. Furlanello et al., Born Again Neural Networks, ICML (2018). <https://arxiv.org/abs/1805.04770>*
- *S. Matin et al., Teacher-student training improves the accuracy and efficiency of machine learning interatomic potentials, Digital Discovery 4, 2502 (2025). <https://doi.org/10.1039/D5DD00085H>*
- *I. Amin, S. Raja and A. S. Krishnapriyan, Towards Fast, Specialized Machine Learning Force Fields: Distilling Foundation Models via Energy Hessians, ICLR (2025). <https://arxiv.org/abs/2501.09009>*
- *F. Ekstrom Kelvinius, D. Georgiev, A. P. Toshev and J. Gasteiger, Accelerating Molecular Graph Neural Networks via Knowledge Distillation, NeurIPS (2023). <https://arxiv.org/abs/2306.14818>*
- *W. Li et al., LightPFP: A Lightweight Route to Ab Initio Accuracy at Scale, arXiv:2510.23064 (2025). <https://arxiv.org/abs/2510.23064>*
