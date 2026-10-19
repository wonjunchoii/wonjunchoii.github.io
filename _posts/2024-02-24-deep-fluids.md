---
title: (논문리뷰) Deep Fluids
date: 2024-02-24 11:46:00 +0800
categories: [AI, Fluid Dynamics]
tags: [ai, deep learning, generative Model, fluid dynamics, graphics, simulation]
use_math: true
---
## AI-CFD
최근 들어 classical simulation 을 가속화 하려는 많은 시도가 있었다. 차원 축소 방법인 Proper Orthogonal Decomposition (POD), Reduced Order Mehod (ROM) 이 그동안 많이 쓰였지만, 두 기법이 사용하는 basis function은 일반적으로 선형 차원축소 방법이다. 선형적인 representation을 비선형적인 manifold 에 올려놓는 작업을 하게 되면 "explosion of subspace dimensionality" 현상이 일어날 수 있다. 해당 문제를 해결하고자 iterative convolution network를 이용하여 효과적으로 데이터를 압축하고, 비선형적인 데이터를 다룰수 있도록 제시한 문헌을 찾아 정리해 본다.

문헌: [Deep Fluids: A Generative Network for Parameterized Fluid Simulations](https://arxiv.org/pdf/1806.02071)

## Introduction
### Traditional Machine Learning / Deep learning
Random forest 모델과 같이 machine learning기법은 정교하게 다듬어진 feature(특징)을 필요로 하기 때문에 일반성이 떨어지게 된다. 보통 딥러닝 방법을 사용해 하나의 time step에 대한 압력장을 구하기 위해 CNN 기법을 사용하게 되고, 여러 time step에 대해 압력장을 예측하는데에는 LSTM 기반 방법을 사용한다. 이와 같은 기법은 pressure projection 단계에서만 작동하기 때문에 divergence-free 를 만족시키지 못하게 된다. 여러 ML/DL 연구가 진행되었지만 모두 initial condition 을 받아 하나의 steady state solution을 예측할 뿐 시뮬레이션은 불가능하다. 또한 모든 연구가 2D에서 진행 된다는 점에서 한계가 명확하다. [Ladický, L'ubor, et al.]

### Reduce Order Method (ROM)
일반적으로 시뮬레이션을 진행 할 때, 연산량이 많이 요구되기 때문에 기존 차원에서 subspace로 매핑해주면서 차원을 축소하는 과정이 필요하고, 이를 ROM 이라고 한다. ROM 이 사용하는 basis function (i.e. Laplacian Eigenfunctions)은 일반적으로 선형적으로 작동하게 된다. 추가적인 기법으로 선형적 representation을 비선형 manifold에 올려놓는 작업을 진행하게 된다. 이 과정에서 explosion of subspace dimensionality 현상이 일어날 수 있다. 이를 해결하고자 해당 논문의 저자는 CNN 기반 비선형 manifold learning을 진행했다.

전통적인 SVD 기반 subspace 알고리즘을 사용할 경우에 20~ 시간이 걸리지만, iterative convolutional network를 사용함으로써 속도가 개선이 되었다. 데이터를 추출하는데 기존 cpu 기반 방법보다 700배 이상 빨랐으며, 데이터 압축률은 1300배 단위로 압축이 가능하다고 주장한다. 따라서 준실시간 해석이 가능하다.

<img src="{{page.img_pth}}deepFluidsStats.png">

## Implementation
### Generative Model
논문의 저자는 기존 모델들의 단점을 보완하기 위해 generative model을 사용했다. Output의 크기는 [H, W, D V<sub>dim</sub>] 의 크기를 가지며, \\(D=1 (2D), 3 (3D)\\)로, V<sub>dim</sub>은 벡터장의 차원수 이다. Input (c vector)의 크기는 \\(\frac{H}{2^q}\times \frac{W}{2^q}\times \frac{D}{2^q}\times 128\\)를 가진다. 128은 실험 결과 가장 최적의 값이라고 한다. 각 layer당 q번의 Big Block (BB)를 계산하고, 각 BB당 N번 (저자는 N=4~5 사용)의 Small Block (SB)를 사용했다. 여기서, \\(q \geq 0\\), \\(d_{\text{max}} = \max(H, W, D)\\) 이고 \\(q = \log_2(d_{\text{max}}) - 3\\)이다. 마지막 레이어에는 output 차원을 맞춰주기 위해 추가적인 convolutional layer를 사용한다. 

<img src="{{page.img_pth}}smallbigblock.png">

저자는 이미지의 차이를 계산하기 위해 기본적인 L1, L2 norm을 사용하지 않고 divergence-free motion을 보장하기 위해 아래와 같은 손실함수를 사용했다.

$$L_G(\mathbf{c}) = \left\| \mathbf{u}_c - \nabla \times \mathbf{G}(\mathbf{c}) \right\|_1
$$

하지만 compressible flow 와 같은 영역을 다룰 때에는 direct inference를 사용했다.

$$L_G(\mathbf{c}) = \left\| \mathbf{u}_c - \mathbf{G}(\mathbf{c}) \right\|_1
$$

두가지 방법의 차이는 아래와 같다. 실험 결롸, incompressible loss 사용시 성능이 향상되었다고 한다.

<img src="{{page.img_pth}}deepfluid_losses.png">

속도장에 대한 L1 distance만 사용할 경우, 노이즈가 발생하거나 vorticity, shear, divergence등 second-order의 정보를 제대로 인코딩 하지 못하는 단점이 있다. 따라서 추가적인 divergence loss도 사용하여 보완했다. (저자는 \\(\lambda_{\mathbf{u}} = \lambda_{\nabla \mathbf{u}} = 1\\) 사용)

$$L_G(\mathbf{c}) = \lambda_{\mathbf{u}} \left\| \mathbf{u}_c - \hat{\mathbf{u}}_c \right\|_1 + \lambda_{\nabla \mathbf{u}} \left\| \nabla \mathbf{u}_c - \hat{\nabla \mathbf{u}}_c \right\|_1
$$

### Parameterizations - AutoEncoder
단순한 시뮬레이션의 경우 generative model로도 충분히 해석이 가능하지만, 역동적인 해석 (i.e. source가 움직이는 해석, 가변 inlet flux를 가지는 해석 등)은 고정된 parameter 개수를 가지는 것이 아니라 time frame 개수만큼의 길이를 갖게 된다. 즉, 프레임 개수에 따라 선형적으로 파라미터 개수가 증가한다. 따라서 생성모델 외에 인코더 아키텍처를 추가 함으로서 reduced vector를 추출한 뒤, time integration network와 결합하여 해결했다. 생성 아키텍처와 반대로 속도장 𝒖를 \\(\mathbf{c} = [\mathbf{z}, \mathbf{p}] \in \mathbb{R}^n
\\)으로 매핑하며, \\(\mathbf{z} \in \mathbb{R}^{n-k}
\\)는 비지도학습 방식으로 추출된 reduced latent space이다. \\(\mathbf{p} \in \mathbb{R}^k
\\)는 특정 attribute를 컨트롤 하기 위한 지도방식의 parameterization
이를 통해 sparser latent space를 얻을 수 있고, 속도장의 reconstruction에도 좋은 영향을 끼친다. 예시로 오른쪽 그림은 n=16, p=[x_좌표, z_좌표]를 사용한다.

$$L_{AE}(\mathbf{c}) = \lambda_{\mathbf{u}} \left\| \mathbf{u}_c - \hat{\mathbf{u}}_c \right\|_1 + \lambda_{\nabla \mathbf{u}} \left\| \nabla \mathbf{u}_c - \hat{\nabla \mathbf{u}}_c \right\|_1 + \lambda_{\mathbf{p}} \left\| \mathbf{p} - \hat{\mathbf{p}} \right\|_2^2
$$

<img src="{{page.img_pth}}deepfluidAE.png">

### Latent Space Integration Network
Latent Space Integration Network는 시간에 따른 확산을 velocity field states (\(\mathbf{z}\))를 통해 학습하게 된다. 시간에 따른 확산을 LSTM과 같은 모델처럼 시간을 변수로 두어 학습하지 않고, FC 레이어를 사용하여 “manifold navigator”로 사용했다.

$$
T(\mathbf{x}_t) : \mathbb{R}^{n+k} \to \mathbb{R}^{n-k}
$$

$$
\mathbf{x}_t = [\mathbf{c}_t; \Delta \mathbf{p}_t] = [\mathbf{z}_t; \mathbf{p}_t; \Delta \mathbf{p}_t] \in \mathbb{R}^{n+k}
$$

다음 스텝의 \(\mathbf{z}\), \(\mathbf{z}_{t+1}\),은 아래와 같이 계산된다.
$$
\mathbf{z}_{t+1} = \mathbf{z}_t + T(\mathbf{x}_t)
$$
미래의 \(\mathbf{z}\) 값을 사용하여 loss function을 계산하게 된다:
$$
L_T(\mathbf{x}_t, \ldots, \mathbf{x}_{t+w-1}) = \frac{1}{w} \sum_{i=t}^{t+w-1} \left\| \Delta \mathbf{z}_i - T_i \right\|_2^2
$$

<img src="{{page.img_pth}}deepfluidsFC.png">

## Result
2D smoke plumes 해석 결과이다. 지도학습의 변수는 1개로 (px)로, smoke source의 위치를 나타낸다. 학습한 적이 있는 (px=0.5)데이터에 대해서는 Ground Truth 값과 거의 유사한 것을 확인 할 수 있다. (첫번째 그림) 학습한 적이 없는 데이터의 경우 interpolation 성능은 두번째 그림 (아래)와 같다. 직접적으로 일치하지 않은 파라미터이지만, 준수한 성능을 보여주는 것을 볼 수 있다.

<img src="{{page.img_pth}}2dsmokeplumes.png">

<img src="{{page.img_pth}}2dsmokeplumsinterpolate.webp">

아래는 3D smoke cases이다. 인풋 파라미터는 구의 중심 위치(p<sub>x</sub>) 10가지이고, 각 샘플당 660 프레임이므로 총 6600개의 데이터셋을 이용하여 학습된 결과이다. p<sub>x</sub>=0.44 (1st col) 과 0.5 (4th col)의 현상이 매우 다름에도 불구하고 semantic representation 을 성공적으로 수행한 것을 볼 수 있다. 또한, 데이터가 꽤 sparse 함에도 불구하고 좋은 성능을 보여준다.

<img src="{{page.img_pth}}3dsmokecases.webp">

## Discussion
딥러닝 기반의 방법론이므로 데이터의 품질에 따라 성능이 결정되게 된다. 낮은 주사율, 파라미터 (inlet 위치, 개수 등)에 따라 성능에 차이가 생길 수 있다. (디테일한 부분 구현 불가) 하지만, 장점으로는 특별한 boundary condition 없이 학습/해석이 가능하다는 것이다. 구조물에 침투하는 현상이 아예 없는것은 아니지만, 성능에 영향을 줄만큼의 오차는 생기지 않는다. 아래는 다른 기법과 (Lin. et al) 저자의 기법(CNN)을 비교한 사진이다. 이를 보면 boundary를 성공적으로 모사 할 수 있는 것으로 보인다. 하지만, 복잡한 형상을 가진 구조물에 대한 성능은 미지수이다.

<img src="{{page.img_pth}}deepfluidCompare.webp">

### Limitation
아래 그림은 inlet의 위치, 넓이, 시간을 학습된 범위 바깥 range 의 값으로 시뮬레이션을 진행한 결과이다. 10%까지는 어느정도 예측이 정상 범주내에서 이루어지지만 20%이상의 extrapolation은 성능이 저하되는 것을 볼 수 있다.

<img src="{{page.img_pth}}deepfluidsInterpolation.png">

이 외에도 해당 모델의 limitation 은:
- 굉장히 다양한 상황들에 대한 (임의의)velocity field를 reconstruction하는 데에 한계가 있음
- 특정 boundary condition에 대한 physical constraints가 존재하지 않음
- 즉, 학습한 데이터와 유사한 상황에서만 interpolation, extrapolation, reconstruction 등이 잘 수행될 수 있음

---
참고자료
- *<Ladický, L'ubor, et al. "Data-driven fluid simulations using regression forests." ACM Transactions on Graphics (TOG) 34.6 (2015): 1-9.>*