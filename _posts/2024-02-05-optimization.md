---
title: 다양한 optimization 기법들
date: 2024-02-05 14:37:00 +0800
categories: [AI, Deep Learning]
tags: [optimization, deep learning, neural networks, gradient descent,mini-batch, momentum, learning rate scheduling, weight decay, dropout, early stopping, hyperparameter tuning]
use_math: true
---

Optimizer는 loss function을 통해 기울기를 구하고, network의 파라미터를 학습에 어떻게 반영시킬 지 결정하는 방법이다.

딥러닝 학습의 궁극적 목표는 parameter space(W)에서 loss function의 global minimum 값을 찾는것이다. 여기서 전제조건은, 데이터의 양이 충분히 general enough to capture the entire phenomenon or domain under study. 따라서 데이터의 양이 충분히 많아야 학습이 된다는 전제 조건이 있다.

모든 데이터셋을 모델에 한번에 입력하고, 학습시키면 생기는 문제점이 있다.
- computationally expensive
- errors faced when dealing with difficult samples can be drowned out when averaged alongside all the other samples in the dataset

이를 해결하기 위해 Batching을 사용한다.

$$L=L(\mathbf{x},W)$$

$$\mathbf{x}=[x_1, x_2, x_3, ..., x_m]$$

$$L(\mathbf{x}, W) = \frac{1}{m}\sum_{i=1}^mL(x_i, W)$$

데이터를 \\(m\\) 크기의 배치 단위로 끊어 Loss를 구해 학습을 시킨다.

Optimizer의 종류는 아래 그림과 같다.

<img src="{{page.img_pth}}optimizer.png" width="580">

 스텝 방향을 조절
- [Gradient Descent](#gradient-descent)
- [Momentum](#momentum)
- [NAG](#nag)

스텝 사이즈 (\\(\eta\\))를 조절
- [Adagrad](#adagrad)
- [Adadelta](#adadelta)
- [RMSprop](#rmsprop)
- [Adam](#adam)
- [NAdam](#nadam)


## Gradient Descent
<img src="{{page.img_pth}}gd_optimizer.png" width="580">

1회의 학습 step시, 현재 모델의 모든 데이터에 대해서 예측값에 대한 loss 미분을 learning rate만큼 보정해서 반영한다. 이것을 반복하여 loss function의 값을 최소화 하는 \\(\theta\\) 의 값을 찾는다.

Gradient descent는 현재 있는 위치(현재 \\(\theta\\)) 에서 기울기의 방향으로 \\(\eta\\) 만큼의 비율로 움직이며 minima를 찾아가게 된다. 다변수 함수에 대해 일반화된 수식은 다음과 같다.

$$\theta_{t+1}=\theta_t-\eta\nabla_\theta J(\theta)$$

랜덤한 시작 위치 \\(\theta\\) 에서의 기울기인 \\(\nabla_\theta J(\theta)\\) 만큼 반대방향으로 움직여 준다.

Gradient Descent는 크게 세가지 종류가 있다.
### Batch GD
ML/DL 에서는 batch는 데이터 전체를 의미한다. 손실함수는 보통 \\(J = \sum_{i=1}^N error\\) 로 정의되는데 N개의 모든 데이터를 사용하여 손실함수를 만든다는 의미이다.
이는 한번의 \\(\theta\\), 즉 모델의 파라미터를 업데이트하기 위해 모든 학습 데이터가 계산에 사용됨으로 속도가 많이 느리다. 

### Stochastic GD
SGD는 한번의 파라미터 업데이트를 위해 하나의 훈련 데이터를 사용한다. 수식은 다음과 같다.

$$\theta_{t+1}=\theta_t-\eta\nabla_\theta J(\theta;x^{(i)}, y^{(i)})$$

SGD는 batch GD보다 훨씬 빠르게 업데이트가 된다. 하지만 하나의 데이터에 의해 손실함수의 기울기가 계산되기 때문에 둘쭉 날쭉한 gradient로 파라미터를 업데이트 하게 된다.

### Mini-batch GD
Mini-batch 사이즈의 데이터마다 손실함수를 만들고 gradient를 계산하여 파라미터를 업데이트 한다. Batch GD보다 빠르고, gradient의 크기도 들쭉 날쭉하지 않다.

## Momentum
이전 step의 방향(관성)과 현재 상태의 gradient를 더해 현재 학습할 방향과 크기를 정한다. 수식으로 이해해보자.

$$v_t = \gamma v_{t-1}+\eta \nabla_{\theta_t}J(\theta_t)$$

$$\theta_{t+1}=\theta_t-v_t$$

쉽게 얘기하면, 미끄럼틀의 끝에서 gradient=0 인 평평한 면을 만났다고 해도, 그 전 스텝의 gradient가 남아있어 앞으로 쭉 밀리게 만들어준다.
하지만 이렇게 되면 아주 긴 평평한 땅에서도 절대 멈추지 않는 현상이 생길 것이다. 따라서 momentum은 이전 gradient들의 영향력을 매 업데이트마다 \\(\gamma\\) 씩 감소시켜준다. 다시 수식으로 이해해보자.
\\(g_t = \eta \nabla_{\theta_t}J(\theta_t)\\) 이고, \\(v_1 = g_1\\) 라고 하면

$$v_2 = g_2 + \gamma g_1$$

$$v_3 = g_3 + \gamma g_2 + \gamma^2 g_1$$

$$v_4 = g_4 + \gamma g_3+ \gamma^2 g_2+ \gamma^3 g_1$$

등등오래된 gradient의 영향력을 줄이며 모멘텀을 만든다. \\(\gamma\\) 값은 보통 0.9를 사용한다고 한다. 

## NAG
Nestrov Accelerated Gradient(NAG) 는 lookahead gradient라는 업에디트 방법을 [Momentum](#momentum) 기법에서 약간 변형시킨 방법이다.

<img src="{{page.img_pth}}momentum_optimizer.png" width="580">
*일반적인 [Momentum](#momentum)기법*

<img src="{{page.img_pth}}lookahead_optimizer.png" width="580">
*NAG를 사용한 기법*

수식은 다음과 같다.

$$v_t=\gamma v_{t-1}+\eta \nabla_{\theta_t}J(\theta_t-\gamma v_{t-1})$$

$$\theta_{t+1} = \theta_t-v_t$$

사실 momentum 기법과 크게 다른점은 없지만 수렴지점에서 요동치는 것을 방지해준다고 한다. RNN의 성능을 향상시켰다는 소문이 있다. 해당 기법에 대한 논문은 [링크](https://arxiv.org/abs/1609.04747) 참조!

## Adagrad
Adaptive Gradient Descent(Adagrad)이다.

기존 optimizer 기법들은 모든 파라미터에 대해서 같은 learning rate를 적용하여 업데이트를 한다. 이것이 필요한 이유는 아래 예시를 보자.
\\(i\\) 번째 레이어의 인풋 값을 \\(a_1, a_2, ..., a_n\\) 이라고 하자. 다음 레이어로 넘어가기 전에 해당 파라미터들과 선형 결합을 해준다.

$$w_0+w_1a_1+w_2a_2+...+w_na_n$$

이때, 유독 \\(a_2\\)의 값만 0이 나온다고 해보자. 그러면 \\(w_2a_2\\) 텀도 0이 될것이고, 이에대한 손실함수 값도 0이 될것이다. 계속 0이 나오는 값을 가지고 있다가 갑자기 0이 아닌 데이터가 들어왔다고 해보자. 아주 오랜만에 손실함수에 \\(w_2\\)가 등장할 것이고 업데이트를 할 것이다. 하지만 그동안 \\(w_2\\)는 상대적으로 조금 업데이트 되었기 때문에 수렴점까지 아직 거리가 많이 남은 상태이다. 따라서 상대적으로 더 크게 업데이트를 해주어야만 수렴지점으로 더 빨리 접근 할 것이다. 

파라미터마다 지금까지 얼마나 업데이트 되었는지 알기 위해서 Adagrad는 parameter의 이전 gradient들을 저장한다. 
- \\(t\\)번째 스텝의 \\(i\\)번 파라미터를 \\(\theta_{t,i}\\),
- \\(t\\) 시점에서 \\(\theta_{t, i}\\)에 대한 gradient 벡터를 \\(g_{t,i}=\nabla_{\theta_t}J(\theta_{t,i})\\) 라고 하자.

- 각 파라미터에 대한 식을 [Gradient Descent](#gradient-descent) 형식으로 나타내면 다음과 같다.

$$\theta_{t+1,i}=\theta_{t,i}-\eta g_{t,i}$$

- Adagrad 의 식은 아래와 같다.

$$\theta_{t+i}=\theta_{t,i}-\frac{\eta}{\sqrt{G_{t,ii}+\epsilon}}g_{t,i}$$

\\(G_t\\)는 \\(i\\) \\(i\\)번째 대각원소로 \\(t\\)시점까지의 \\(\theta_i\\)에 대한 gradient들의 제곱의 총합을 가지는 대각행렬이다. 즉,

$$G_{t, ii}=g^2_{1,i}+g^2_{2,i}+...+g^2_{t,i}$$

이다. Vectorize form은 다음과 같다.

$$\theta_{t+i}=\theta_{t}-\frac{\eta}{\sqrt{G_{t}+\epsilon}} \odot g_{t}$$

업데이트 빈도수가 높았던 파라미터는 분모에 의해 \\(\eta\\) 보다 작게 업데이트 되는것을 알 수 있다. \\(\eta\\) 값은 주로 0.01을 사용한다고 한다. 하지만 Adagrad는 \\(t\\)가 증가하면서 분모가 커지게 되고, learning rate가 소실된가는 단점이 있다.

[참고 문헌](https://arxiv.org/abs/1609.04747)

## Adadelta
[Adagrad](#adagrad)를 사용하다 보면 learning rate가 계속 작아지는 현상이 일어난다. 또한, learning rate(\\(\eta\\))가 hyperparameter 로 필요하다는 것이다. 이를 보완하고자 Adadelta가 만들어졌다.

지난 모든 gradient의 정보를 저장하는 것이 아니고 지난 $w$ 개의 gradient 정보만 저장한다. 또한, gradient 제곱의 합을 저장하지 않고, gradient 제곱에 대한 기댓값을 저장한다.

$$E[g^2]_t$$

과거의 gradient 정보의 영향력을 감소시키기 위해 다음과 같은 식을 사용했다.

$$E[g^2]_t=\gamma E[g^2]_{t-1} + (1-\gamma)g_t^2$$

이를 **decaying average of squared gradient** 라고 부른다. 이 정보를 사용해서 \\(\Delta \theta _t\\) 를 다음과 같이 계산한다.

$$\Delta \theta _t = -\frac{\eta}{\sqrt{E[g^2_t]+\epsilon}}g_t$$

$$
X_{RMS} = \sqrt{\frac{x^2_1+x^2_2+x^2_3+\ldots+x^2_n}{n}},
$$

$$\Delta \theta _t = -\frac{\eta}{RMS[g]_t}g_t$$

논문의 저자는 parameter \\(\theta\\)를 업데이트 할 경우 \\(\Delta \theta\\)의 단위가 맞지 않다는 것에 주목했다. 간단한 예로 길이(m 단위)를 업데이트 할 때에 속도(m/s 단위)를 이용해서 업데이트 하면 안된다는 것이다. 파라미터를 업데이트 할 때, 

$$\theta _t = \theta _{t-1}+ \Delta \theta$$

에서 \\(\Delta \theta\\)는 \\(g=\nabla_{\theta_t}J(\theta_t)\\) 를 포함 하고 있기 때문에,

$$\Delta \theta \propto g \propto \frac{\delta J}{\delta \theta}\propto \frac{1}{\text{unit of }\theta}$$

로 정리 할수 있다. 위에서 언급 했던대로 길이를 속도로 업데이트 하고 있다는 뜻이다. 따라서 위 식에 Hessian approximation을 사용하는 Newton's method 방법을 사용해 단위를 맞춰준다. 

$$\Delta\theta = -H^{-1}g = -\frac{\frac{\partial f}{\partial \theta}}{\frac{\partial ^2 f}{\partial \theta ^2}} $$

$$\Delta \theta \propto H^{-1}g \propto 
\frac{\partial f/ \partial \theta}{\partial ^2 f / \partial \theta ^2}
\propto \text{unit of }\theta$$

위 결과에 이동 평균을 이용하여 미분의 제곱에 대한 RMS를 계산한다.

$$
E[\Delta \theta^2]_t = \gamma E[\Delta \theta^2]_{t-1} + (1-\gamma) \Delta \theta^2_t
$$

여기서 \\(\gamma\\)는 이동 평균 계산 시 사용되는 감마(gamma) 값이다. 파라미터 업데이트를 정리해보면, 

\\[
\Delta \theta_t = -\frac{RMS[\Delta \theta]_{t-1}}{RMS[g]_t} g_t
\\]

여기서 \\(g_t\\)는 현재 스텝에서의 그래디언트를 나타내며, \\(RMS[\Delta \theta]_{t-1}\\)은 이전 스텝에서의 파라미터 업데이트의 RMS 값이다. 계산된 파라미터 업데이트를 사용하여 파라미터를 업데이트 하면 다음과 같다.

\\[
\theta_{t+1} = \theta_t + \Delta \theta_t
\\]

[Adadelta 논문](https://arxiv.org/abs/1212.5701)

## RMSprop
RMSprop은 Adadelta와 마찬가지로 Adagrad에서 learning rate가 점차 작아지는 문제를 해결하기 위해 제안되었다. 지난 gradient 제곱을 모두 더하는 대신 지수 가중 평균을 사용하며, 실제로 Adadelta의 첫 번째 업데이트 식과 동일하다.

$$ E[g^2]_t = 0.9 E[g^2]_{t-1} + 0.1 g^2_t $$

\\[ \theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{E[g^2]_t} + \epsilon} g_t \\]

적절한 \\(\gamma\\) 값으로 0.9를, \\(\eta\\) 값으로 0.001을 제안했다.

## Adam
Adam(Adaptive Moment estimation)은 [Adagrad](#adagrad), [Adadelta](#adadelta), [RMSprop](#rmsprop)과 같이 각 파라미터마다 다른 크기의 업데이트를 적용하는 방법 중 하나이다. 특히, Adadelta에서 사용한 decaying average of squared gradients (\\(E[g^2]_t\\))뿐만 아니라 decaying average of gradients ((\\(E[g]_t\\)))도 업데이트에 사용하게 된다. 이전 기법에서의 moment는 "관성"과 같은 의미였다면, 이 맥락에서 Adam의 이름에 있는 moment의 정체는 통계학에서 사용되는 용어이다. 확률변수 X의 n차 moment를 \\(E[X^n]\\)으로 정의하며, 1차 moment \\(E[X]\\)는 모평균이고, 2차 moment \\(E[X^2]\\)와 1차 moment를 사용해서 모분산을 얻을 수 있다. 이러한 추정이 들어간 Adaptive Moment Estimation(적응적 모멘트 추정)이 Adam의 원리이다.

\\(m_t\\)를 gradient의 1차 moment에 대한 추정치, \\(v_t\\)를 2차 moment에 대한 추정치라고 하자. 그리고 이제는 익숙한 가중평균식을 도입하면 다음과 같다:

\\[ m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t \\]
\\[ v_t = \beta_2 v_{t-1} + (1 - \beta_2) g^2_t \\]

\\(m_t\\)와 \\(v_t\\)의 초기값을 0벡터로 주면, 학습 초기에 가중치들이 0으로 편향되는 경향이 있다. 특히 decay rate가 작으면, 즉 \\(\beta_1\\)과 \\(\beta_2\\)가 1에 가까우면 편향이 더 심해지게 된다. 편향을 잡아주기 위해 다음과 같이 bias-corrected를 계산하게 된다:

\\[ \hat{m}_t = \frac{m_t}{1 - \beta^t_1} \\]
\\[ \hat{v}_t = \frac{v_t}{1 - \beta^t_2} \\]

최종적으로 업데이트 식은 다음과 같다:

\\[ \theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t \\]

논문의 저자는 \\(\beta_1=0.9\\), \\(\beta_2=0.999\\), \\(\epsilon=10^{-8}\\)을 default 값으로 설정했다.

[Adam 문헌](https://arxiv.org/abs/1412.6980)

## NAdam
NAdam은 Nesterov-accelerated Adaptive Memoment Adam으로 NAG와 Adam을 합친 기법이다. 이로 인해 Nadam은 Adam과 NAG의 장점을 결합하여, 빠르고 정확하게 전역 최솟값을 찾을 수 있게 된다.

기존의 NAG에서 모멘텀을 조정하는 식은 다음과 같았다:

\\[
g_t = \nabla J(\theta_t - \gamma m_{t-1})
\\]

\\[
m_t = \gamma m_{t-1} + \eta g_t
\\]

\\[
\theta_{t+1} = \theta_t - m_t
\\]

위와 같이 NAG는 현재 위치 (\\(\theta_t\\))에서 현재 모멘텀 (\\(m_t\\))만큼 이동한 자리에서 기울기를 구한다. 그리고, 이것을 전단계의 모멘텀에 더해줌으로서 현재의 모멘텀을 갱신하는 방식이다. NAG는 파라미터 갱신을 위해서 전단계의 모멘텀 (\\(m_{t-1}\\))를 두번 사용한 것을 볼 수 있다. NAdam은 전단계의 모멘텀을 대신해 현재 모멘텀을 사용해서 미래의 모멘텀을 사용하는 효과를 가지게 했다. 이를 NAG의 파라미터 조정에 반영하면 다음과 같다:

\\[
g_t = \nabla J(\theta_t)
\\]

\\[
\theta_{t+1} = \theta_t - (\gamma m_t + \eta g_t)
\\]

위 방법을 Adam에 적용하기 전, Adam의 파라미터 수정 부분을 풀어서 작성해야 한다:

$$
\theta_{t+1} = \theta_t -  \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t
$$

$$
\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \left( \frac{\beta_1 m_{t-1}}{1-\beta_1^t} + \frac{(1-\beta_1)g_t}{1-\beta_1^t} \right)
$$

$$
\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \left( \beta_1 \hat{m}_{t-1} + \frac{(1-\beta_1)g_t}{1-\beta_1^t} \right)
$$


여기서, \\( \hat{v_t} \\)는 Adam의 이동 평균 두번째 모멘트 추정치이고, \\( \hat{m_t} \\)은 이동 평균 첫번째 모멘트 추정치이다.이러한 미래의 모멘텀을 사용하는 효과를 적용하면 다음과 같이 공식을 수정할 수 있다:

\\[
\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon}\left(\beta_1 \hat{m}_t + \frac{(1-\beta_1)g_t}{1-\beta_1^t}\right)
\\]

따라서, Nadam은 Adam과 NAG의 아이디어를 결합하여 파라미터를 업데이트하는 과정에서 미래의 모멘텀을 사용하여 최적화의 효율성을 높일 수 있다는 장점이 있다.




## Optimizer 비교
아래는 각각의 optimizer의 수렴방식을 가시화한 사진이다. 연구에 의하면 SGD가 Adam에 비해 일반화를 잘하지만, Adam의 속도가 월등히 빠르다는 결과가 있다. 이때문에 많은 연구자들이 SGD와 Adam을 결합하려는 시도를 했고, 그 결과 SWATS라는 optimizer가 개발 되었다. 이 외에도 AMSBound, AdaBound등 Adam을 고도화 시키려는 많은 연구들이 진행중이다.

<img src="{{page.img_pth}}compare_optimizer.png">

<img src="{{page.img_pth}}compare_optimizer.gif">


---
참고자료
- *<https://en.wikipedia.org/wiki/Newton%27s_method_in_optimization>*

- *<https://medium.com/konvergen/continuing-on-adaptive-method-adadelta-and-rmsprop-1ff2c6029133>*

- *<http://incredible.ai/artificial-intelligence/2017/04/10/Optimizer-Adadelta/>*

- *<https://www.youtube.com/watch?v=NE88eqLngkg&ab_channel=DeepBean>*