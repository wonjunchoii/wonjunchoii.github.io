---
title: 무작정 Batch Size를 키우는 것이 좋을까?
date: 2024-08-08 20:33:00 +0900
categories: [AI, Deep Learning]
tags: [batch, sgd, overfitting, gradient, learning dynamics]
use_math: true
---

## 학습 효율
데이터가 많아질수록 학습 속도를 가속화 하기 위해 대부분의 모델들은, Multi-GPU 병렬 연산을 위해, 학습 노이즈를 줄이기 위해 Mini-Batch를 사용하여 학습한다. 여기서 의문점이 드는데, 가능하다면 최대한 큰 batch size를 사용하여 학습하는 것이 제일 좋은 방법이 아닐까? 해당 궁금증을 가지고 문헌을 찾아보던 중, 아래 문헌을 찾아 읽어보았다.

논문 링크: [Accurate, Large Minibatch SGD:
Training ImageNet in 1 Hour](https://arxiv.org/pdf/1706.02677)

## 미니배치 학습
간단히 리뷰해보면, SGD의 loss는

$$ L(w) = \frac{1}{|X|} \sum_{x \in X} l(x, w) $$

그리고 minibatch SGD update는 

$$ w_{t+1} = w_t - \eta \frac{1}{n} \sum_{x \in B} \nabla l(x, w_t) $$

과 같이 계산된다. 해당 문헌에서 주장하고자 하는 것은, batch size가 증가함에 따라 lr도 함께 증가해야 한다는 것이다. 문헌을 인용하면,

> **Linear Scaling Rule**: When the minibatch size is
multiplied by \\(k\\), multiply the learning rate by \\(k\\).

먼저 batch size가 \\(n\\)인 상황과 \\(kn\\)인 상황을 고려해보자.

- Batch Size = N 인경우

\\(j\\)가 0부터 \\(k-1\\)까지 계산을 한다. 각 미니배치의 loss를 구하고 가중치를 업데이트 하고를 반복한다.

- Batch Size = kN 인경우

n 인경우에는 가중치가 미니배치마다 변화해 가면서 업데이트가 되나, kn 인경우는 업데이트가 한점 \\(w_{t}\\)에서 적은 횟수 (1/k 번)로 업데이트가 되게 된다.

이 두가지 경우를 수식으로 나타내 보자. 아래 식을 가정한다면,

$$\nabla l(x, w_t) \approx \nabla l(x, w_{t+j}) \quad \forall j < k$$

배치 크기가 \\(n\\)인 경우와 \\(kn\\)인 경우는 다음과 같이 나타낼 수 있다.

$$w_{t+k} = w_t - \eta \frac{1}{n} \sum_{j < k} \sum_{x \in B_j} \nabla l(x, w_{t+j})$$

$$\hat{w}_{t+1} = w_t - \eta \frac{1}{kn} \sum_{j < k} \sum_{x \in B_j} \nabla l(x, w_t)$$

배치 크기를 어떤 값으로 해도 우리의 최종 목표는 같은 weight를 가지는 지점으로 수렴하기를 원한다. Informal intuition으로 \\(k\\)보다 작은 모든 인덱스 \\(j\\)에 대해서 loss의 gradient가 같다고 가정하면, 

$$\hat{w}_{t+1} = w_{t+k}, \quad \hat{\eta} = k \eta$$

가 되게 된다. 현실적으로 완벽히 같은 값으로 수렴하진 않겠지만, 위를 바탕으로 학습 했을 때 저자들은 training curve가 상당히 유사해 졌다고 주장한다.

## Warmup
문헌에서, batchsize n과 kn의 loss가 비슷할 것이다라는 가정이 네트워크 훈련의 처음은 잘 성립이 안된다. 왜냐하면 학습 초기에는 네트워크가 급격히 변하기 때문이다. 따라서, warmup 단계를 추가로 설명하고 있다.

학습 초기에 warmup 하는 방법으로 constant warmup과 gradual warmup이 있다. Constant warmup은 낮은 lr로 초기 (약 5 에포크)로 세팅을 한다. Object detection이나 segmentation에서 도움이 되는 방법이나, 낮은 lr에서 높은 lr로 급격히 변화할 때 train error spike를 볼수 있다. 반대로 gradual warmup은 lr을 점진적으로 증가시키며 경험적으로 classification task에 강점을 보인다고 한다.

## Batch Normalization

BN은 미니배치 차원을 따라 통계를 계산하여 샘플 손실의 독립성을 깨뜨리고, 미니배치 크기의 변화가 손실 함수에 영향을 줄 수 있다. Loss는 input data가 independence 하다고 가정하고 시작하지만 BN을 쓰면 이미 input data를 가지고 통계적으로 수치를 구하기 때문에 independence가 깨지게 된다. 분산 GPU환경에서는 모든 worker의 분산과 평균을 구해서 더해주는 worker간의 communication cost가 어마어마 하게 필요하게 된다. 

아래 식과 같이 independence가 깨진 loss는 lb라고 하고, x가 특정 배치에 dependence한 loss이다. 식을 약간 변형하여 하나의 배치를 X의 n승 즉, n개의 training set의 Cartesian Product라 가정하면 Batch B가 그냥 하나의 Sample이 될수 있고, 이렇게 바꾸면 independence가 아직은 존재 한다고 한다. 그렇게 되면 n이 분산컴퓨팅에 대한 하이퍼 파라미터가 아니고, 그냥 BN에 대한 Hyper parameter라고 가정할수 있다고 한다. 보통 분산 환경에서 모든 worker에서 norm을 구하는 것보다는 한 worker안에서 BN을 진행해야 하는게 좋고, 이렇게 되면 Communication Cost도 줄이고, Loss를 위해서도 좋다고 주장한다.

$$L(B, w) = \frac{1}{n} \sum_{x \in B} l_B(x, w)$$

$$ L(w) = \frac{1}{|X_n|} \sum_{B \in X_n} L(B, w)$$

## Pitfalls of Distributed SGD

$$w_{t+1} = w_t - \eta \frac{1}{n} \sum_{x \in B} \nabla l(x, w_t)$$

$$w_{t+1} = w_t - \eta \lambda w_t - \eta \frac{1}{n} \sum_{x \in B} \nabla \epsilon(x, w_t)$$

우리가 일반적으로 계산하는 Cross Entropy loss를 스케일링 하는 것과 learning rate를 스케일링 하는것은 다르다. Weight decay를 적용하는 경우 learning rate가 weight decay term에도 붙기 때문에 learning rate의 스케일 조절과 cross entropy의 스케일 조절은 다르다. 

### Momentum correction

1. Implementation 1

$$u_{t+1} = m u_t + \frac{1}{n} \sum_{x \in B} \nabla l(x, w_t)$$

$$w_{t+1} = w_t - \eta u_{t+1}$$

2. Implementation 2
$$v_{t+1} = m v_t + \eta \frac{1}{n} \sum_{x \in B} \nabla l(x, w_t)$$

$$w_{t+1} = w_t - v_{t+1}$$

3. Momentum correction
$$v_{t+1} = m \frac{\eta_{t+1}}{\eta_t} v_t + \eta_{t+1} \frac{1}{n} \sum \nabla l(x, w_t)$$

모멘텀 구현은 크게 2가지가 있다. 첫번째는 loss의 gradient 를 구하고 그 다음에 learning rate를 구하는 방법이고, 두번째는 모멘텀을 구할때 이미 learning rate 에타가 이미 곱해지는 상태이다. 그래서 learning rate가 고정일때는 두개가 동일하나, learning rate가 변경될때에는 위와 같이 momentum correction을 해야 한다.

### Gradient aggregation
분산 컴퓨팅 환경에서는 gradient를 aggregation 할때 먼저 로컬머신에서 평균을 구하고, k개의 머신끼리 더해서 평균을 구해야 한다. (\\(\sum l(x, w_t)/n\\)) 그렇지만 보통 분산컴퓨팅 환경에서는 각각 더해주는 작업을 이미 하고 있기 때문에 로컬 머신에서 먼저 k를 나누고 더하는게 좋다고 한다.

### Data shuffling
Random sample보다 random shuffling이 더 좋다고 여러 논문이 주장하고 있다. 분산 환경에서는 매 epoch마다 전체 Data를 k개로 파티셔닝하고, k개의 worker가 각각 파티셔닝된 데이터를 처리 하는 형태로 구현해야 한다. 모든 worker가 큰 데이터 셋에서 샘플링 하던지, 매 epoch마다 새로운 파티셔닝을 해야 하는데 같은 파티셔닝만 쓰게 되면 문제가 생길 수 있다.

## Experiments
### Batch size
<img src="{{page.img_pth}}minibatch_size.png">

위 그림을 보면 learning rate 스케일링 하는 것 만으로도 8k까지는 균일하게 성능을 낸다고 한다. 하지만 미니배치 사이즈가 8k 를 넘어가게 되면 문제가 생긴다고 한다. 

### Warmup
<img src="{{page.img_pth}}batchsize_table.png">
<img src="{{page.img_pth}}gradual_warmup.png">

Baseline은 256 배치크기로 single machine에서 실행한 결과이다. Constant warmup 에러가 25.88, gradual warmup 에러가 23.74로 조금 더 나은 성능을 보인다. 분산을 보면 gradual warmup이 0.09으로 보다 안정적으로 훈련이 된다는것을 볼수 있다.


---
참고자료
- *<https://arxiv.org/pdf/1706.02677.pdf>*