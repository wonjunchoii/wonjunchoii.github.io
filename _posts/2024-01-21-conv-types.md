---
title: Convolution 연산의 종류
date: 2024-01-21 19:57:00 +0800
categories: [AI, Deep Learning]
tags: [convolution, image processing, cnn, deep learning, filtering, feature extraction, matrix convolution, stride, padding, convolution layers, computational efficiency, python]

use_math: true
---

## Convolution Layer
영상에 대한 ***2D Spatial Feature*** 를 추출하는 필터들로 구성되어있다. 하나의 커널은 입력 영상의 각 위치별 반응치를 계산하여 ***2D Response Map***을 출력한다. 수학적으로, 각 위치별로 모든 채널의 픽셀들에 대한 Linear Combination을 수행하는 것이다.

### Convolution Layer vs. FC Layer
FC layer 모델은 모든 인풋 데이터가 모든 아웃풋 데이터에 영향을 준다. 하지만 사람은 물체를 인식할때 이렇게 인식하지 않는다. 사람의 눈, 코, 입과 같은 어떤 물체의 특징의 모양과 위치를 파악해서 사물을 인식한다. 따라서 Convolutional Neural Network(CNN)은 다음을 만족한다.
- Spatial locality: 필터는 주변 픽셀(데이터)를 탐색한다
- Positional invariance: 모든 위치에서 같은 필터를 사용한다

### Memory & Time Cost
Convolution 의 연산량은 \\(CHWK^2N\\)가 되고, 파라미터의 수는 \\(N(CK^2+1)\\)개가 된다.
- C,H,W: 채널, Height, Width
- K: 커널의 크기 (K, K)
- N: 커널의 개수 (output channel)

영상 내의 객체를 정확히 판단하기 위해서는 `Contextual Information`이 중요하다. 객체가 주변의 환경은 어떤지, 다른 객체들은 어떤 환경에 놓여 있는지. 많은 모델들은 충분한 contextual information을 확보하기 위해 넓은 receptive field를 고려한다.

넓은 receptive field를 만족시키기 위해서는 커널의 크기를 키우는 방법과 더 깊은(많은) convolutional layer를 쌓는 방법이 있다. 하지만 이 두가지 방법 모두 연산량이 기하급수적으로 증가한다는 단점이 있다.

#### Expensive Cost
네트워크는 점점 깊어지고, 채널의 수는 증가하게 된다. 이렇게 되면 연산량과 가중치도 비례하여 증가한다. 일반적으로 큰 feature map을 convolution의 입력으로 가져가는 것이 유리하지만, 많은 CNN모델은 computational cost를 고려해서 sup-sampling을 수행한다.

채널의 수를 늘릴수로 더 다양한 필터를 학습 할 수 있게 된다. 하지만 너무 많은 채널수는 오히려 파라미터 수 증가, 학습 속도 저하, 오버피팅과 같은 문제가 생길 수도 있다.

#### Dead Chanels
신경망의 학습 과정에서 출력 결과에 영향을 거의 주지 않는 노드가 나타날 수 있다. 이런 경우, 일반적으로 pruning 을 통해 신경망의 연산량과 파라미터 수를 경량화 할 수 있다.

마찬가지로, CNN에서 이런 현상이 채널 단위에서 일어날 수 있다. 하나의 필터에서, 혹은 전체 신경망 기준으로 불필요한 (학습에 영향을 주지 않는) 채널이 생길 수 있다. 채널의 수는 파라미터 수와 연산량에 직결되기 때문에 엄청난 자원 낭비가 될 수 있다. 채널의 개수는 hyperparmeter 이기 때문에 적당한 채널 개수를 찾는것도 한계가 있다.

#### Low Correlation Between Channels
각 필터는 입력 영상의 모든 채널을 사용하지만, 모든 채널-필터 쌍이 높은 correlation을 가지지 않을 수 있다.

<img src="{{page.img_pth}}convlayer.svg">
*A normal convolutional layer. Yellow blocks represent learned parameters, gray blocks represent feature maps/input images (working memory).*

<img src="{{page.img_pth}}cifar-nin-groupanimation.webp" height="450" width="450">
<img src="{{page.img_pth}}colorbar_conv.svg" width="450">
*The correlations between filters of adjacent layers in a Network-in-Network model trained on CIFAR10, when trained with 1, 2, 4, 8 and 16 filter groups.*

출처: [https://blog.yani.ai/filter-group-tutorial/](https://blog.yani.ai/filter-group-tutorial/)

위 그림과 같이 sparse 한 correlation matrix를 볼 수 있다. 따라서 학습 수렴 속도가 저하되고, 불필요한 가중치와 불필요한 연산을 하기 때문에, 학습 시 일종의 노이즈 처럼 작용 될 수 있다.

이러한 문제점 때문에 연산량을 최소화 하면서, 정보손실이 일어나지 않도록 다양한 Convolution 기법들이 등장했다. 아래는 다양한 convolution 기법들이다. 설명을 돕기 위해 `PyTorch`코드로 설명을 할 예정이다. 또한 padding, stride와 같은 convolution의 기본 개념은 건너뛰도록 하겠다.

- [Convolution](#convolution)
- [Dilated Convolutions (atrous Deconvolution)](#dilated-convolution)
- [Transposed Convolution (Deconvolution or fractionally strided convolution)](#transposed-convolution)
- [Separable Convolution](#separable-convolution)
- [Pointwise Convolution](#pointwise-convolution)
- [Grouped Convolution](#grouped-convolution)
- [Depthwise Convolution](#depthwise-convolution)
- [Depthwise Separable Convolution](#depthwise-separable-convolution)
- [Deformable Convolution](#deformable-convolution)

## Convolution
<img src="{{page.img_pth}}same_padding_no_strides.gif" width="320">
*2D Conv with kernel size 3, padding 1, stride 1*

일반적으로 알고 있는 2D Conv이다. 합성곱 연산을 통해 feature map을 추출해 낸다. 식을 자세하게 나타내면 다음과 같다.

$$
\text{out}(N_{i}, C_{out}) = \text{bias}(C_{\text{out}_{j}}) + \sum_{k=0}^{C_{\text{in}}-1} \text{weight}(C_{\text{out}}, k) \otimes \text{input}(N_{i}, k)
$$

```python
torch.nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=1, padding=1)
```

## Dilated Convolution
<img src="{{page.img_pth}}dilation.gif" width="320">
*2D Conv with kernel size 3, padding 0, stride 1, dilation rate 2*

```python
torch.nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=1, padding=0, dilation=2)
```

Dilated convolution은 기본 convolotion에서 커널 계산에 사용되는 픽셀 간격을 늘린 형태이다. Dilation rate는 커널이 인식하는 픽셀 사이의 간격을 말한다. 3x3 커널에 dilation rate 2를 사용하면 9개의 파라미터를 사용하면서 5x5커널과 동일한 view를 가질 수 있다는 장점이 있다. 이떄문에 real time segmentation 분야에서 자주 쓰이는 기법이다. 커널 연산에 zero padding을 통해 넓은 receptive field를 가질 수 있고, 적은 계산 비용으로 receptive field를 늘릴 수 있는 방법이다.

<img src="{{page.img_pth}}atrous_conv.png" width="380">

위 그림은 해당 [문헌](https://arxiv.org/pdf/1606.00915.pdf)에서 발췌한 figure이다. 그림에서 볼 수 있듯, 기존 방법처럼 downsample-convolution-upsample 과정을 거치게 되면 공간적 정보의 손실이 있는 데이터를 upsample 하기 때문에 해상도가 상당히 낮은 결과를 얻을 것을 볼 수 있다. 하지만 dilated convolution연산을 통해 receptive field를 넓게 가져감으로서 정보의 손실을 최소화 하면서 큰 해상도의 결과를 얻을수 있다는 장점이 있다. Dilated convolution은 결과적으로 contextual information을 빠르고 적은 계산비용으로 계산하기에 적합한 기법이다.

## Transposed Convolution
<img src="{{page.img_pth}}padding_strides_transposed.gif" width="320">
*Transposed conv with kernel size 3, padding 1, stride 2, input_size 3*

```python 
torch.nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=2, padding=1)
```
첫 transposed convolution을 접했을 때 엄청 헷갈렸었다. 많은 자료에서 해당 기법을 deconvolution이라고 많이 설명하는데, 이는 잘못된 표현이다. Deconvolution처럼 같은 차원의 데이터를 계산한다는 데에는 같지만, 학습을 통해 kernel 값을 찾아가며 연산한다는 점에서 다르다고 볼 수 있다. Transpose convolution은 다음과 같은 순서로 계산할 수 있다.

1. New parameter \\(z\\) and \\(p'\\)
    
    - \\(z=s-1\\)
    - \\(p'=k-p-1\\)
    - \\(s'=1\\)

2. Zero padding the input data in between each row/col

    - \\(\text{input_size} = (2\times i-1)^2\\)

3. Zero padding the modified input data by \\(p'\\)

4. Do convolution with stride 1

따라서 input,kernel,padding,stride 의 \\(i\\),\\(k\\),\\(p\\),\\(s\\)가 주어졌을때 output 한변의 길이 \\(o\\)는 아래의 공식을 따른다.
\\[o=(i−1)∗s+k−2p\\]

이러한 특성 때문에 transposed convolution이 쓰이는 모델은 다양하다. CNN 기반 autoencoder 모델에서, 압축된 latent vector를 decoder로 복원할 때 upsampling 하기 위해 사용된다. 또한 비슷한 맥락으로, DCGAN모델에서도 latent vector를 복원하여 이미지를 생성하기 위해서도 사용된다.

## Separable Convolution
Separable convolution은 말 그대로 "분리 가능한 합성곱"이다. 이 방법은 주로 이미지와 커널의 공간 차원, 즉 높이와 너비에 중점을 둔다. 이 방법은 두개의 작은 커널로 나누는데, 가장 흔한 예로는 3x3 커널을 3x1과 1x3으로 나누는 것이 있다. 따라서 9 번의 곱셈을 사용하는 것 대신 3 번의 곱셈을 2 번 수행하여 같은 효과를 얻을 수 있다는 장점이 있다.

적은 곱셈 → 낮은 계산 복잡성 → 빠른 네트워크

<img src="{{page.img_pth}}spatial_separable_conv.png" width="620">
*Wang (2018)*

Separable convolution의 장점 중 하나는 엣지 검출을 위한 소벨(Sobel)과 같은 유명한 커널이 이 방식으로 공간적으로 분리될 수 있다는 것이다. 또한, 표준 컨볼루션에 비해 적은 행렬 곱셈이 필요하다.

\\[
\begin{bmatrix}
3 & 6 & 9 \cr
4 & 8 & 12 \cr
5 & 10 & 15
\end{bmatrix}
=
\begin{bmatrix}
3 \cr
4 \cr
5
\end{bmatrix}
\times
\begin{bmatrix}
1 & 2 & 3
\end{bmatrix}
\\]

그러나 이러한 장점에도 불구하고, 공간적으로 분리 가능한 컨볼루션은 딥 러닝에서는 거의 사용되지 않는다. 그 이유는 모든 커널이 두개의 커널로 나눌 수 없기 때문이다. 나눌수 있는 가능한 조합을 찾는 것이 computationally expensive하기 때문에 모델의 성능이 더욱 나빠질 수 있다. 많이 사용하지 않는 방법이지만, 빠른 네트워크를 구축할 수 있다는 장점이 있는 방법이라고만 알고 있으면 될 것 같다.

## Pointwise Convolution
Pointwise convolution은 인풋 데이터의 공간방향의 convolution은 진행하지 않고, 채널방향의 연산만 진행한다. 다른 말로, `channel reduction`에 주로 사용된다. 아래 그림과 같이 입력 연산에 대해 1x1 커널을 이용하셔 spatial feature를 추출하지 않고, 채널방향으로 convolution을 진행하게 된다.

<img src="{{page.img_pth}}pointwise_conv.png" width="500">

위 그림처럼 입력 영상에 1x1 커널을 이용하여 한개의(혹은 적은 개수의)채널로 압축시켜버리는 효과를 가지고 있다. 여기서 커널(필터)는 각 채널별로 coefficient를 가지는 linear combination을 표현 하는것으로 이해할 수 있다. 특정 상수를 통해 다채널 데이터에서 더 적은 데이터로 임베딩 하는 것이다. 채널 수를 줄임으로서 다음 레이어에서 계산되는 파라미터 수와 계산량을 줄일 수 있는 효과가 있다. 이처럼 채널에 대해 linear combination을 적용하면 불필요하거나 낮은 coefficient를 가지는 채널들을 솎아낼 수 있고, 연산 결과에서 희석시킬 수 있는 장점이 있다. 따라서 연산 속도가 향상되지만, 데이터를 압축/임베딩 하는 과정에서 데이터 손실이 일어날 수 있다. 해당 기법은 Inception / Xception / SqueezeNet / MobileNet 에서 사용되어 성능이 검증된 방법이다.

```python
torch.nn.Conv2d(in_channels, out_channels, kernel_size=1)
```

## Grouped Convolution
Grouped convolution은 채널을 group별로 나누어 따로따로 계산하는 방식이다. Group으로 나누어 개별적으로 convolution 연산을 진행하기 때문에 병렬화 처리에 유리한 장점이 있다. 또한 기존 2D convolution에 비해 낮은 파라미터 수를 가지기 때문에 연산에 있어 유리한 기법이다. 파라미터 수는 \\( (C_{\text{in}} \times k^2 \times C_{\text{out}}) / g \\) 이다. Paramter 개수는 다음과 같이 계산된다. 입력 채널은 \\(C\\), 출력 채널은 \\(M\\)이다.

- 기존 Convolution
    - 커널 크기: \\(K^2C\\)
    - 파라미터 수: \\(K^2CM\\)
    - 연산량: \\(K^2CMHW\\)

- Grouped Convolution
    - 그룹당 채널수(입력): \\(C / g\\)
    - 그룹당 채널수(출력): \\(M / g\\)
    - 파라미터 수(한 그룹): \\(K^2(C/g)(M/g)\\)
    - 총 파라미터 수(\\(\times g\\)개의 그룹): \\((K^2CM)/g\\)
    - 연산량: \\((K^2CMHW)/g\\)


아래 그림을 보면 이해가 쉽다.

<img src="{{page.img_pth}}grouped_conv.png" width="500">

Group의 개수를 조절하며 독립적인 필터의 학습을 기대할 수 있다. 그룹 수를 늘리면 학습하는 parameter수가 줄면서 성능 향상이 일어나는 경우도 있다. 하지만 그룹의 개수는 hyperparameter 이기 때문에 많은 그룹의 분할은 오히려 성능하락의 원인이 될 수 있다. 

```python
torch.nn.Conv2d(in_channels, out_channels, kernel_size=3, groups=2)
```

## Depthwise Convolution
일반적인 convolution 연산은 모든 채널공간에 대해서 계산을 하기 때문에 각 채널에서의 특성(spatial feature)을 추출하기 어렵다는 한계가 있다. Depthwise convolution은 이 한계를 극복하고자 각각의 채널에 대해서만 concolution연산을 진행하는 방식을 택했다. MobileNet과 같은 구조에서 depthwise convolution을 사용하여 연산량을 기하급수적으로 줄여 실시간으로 동작 할 수 있도록 설계하였다. 

<img src="{{page.img_pth}}depthwise_conv.png" width="400">

위 그림을 보면 8x8x3 데이터를 3x3x3 커널을 이용해 depthwise convolution을 하는 것을 볼 수 있다. 각 8x8채널별로 3x3 커널을 이용해 convolution 연산을 진행하고, concatenate하는 구조이다. 채널방향의 convolution보다, 공간방향의 convolution으로 이해하면 된다. 여기서 각 커널은 하나의 채널에 대해서만 파라미터를 가지기 때문에 입력과 출려
 
즉, 각 커널들은 하나의 채널에 대해서만 파라미터를 가진다. 그래서 입력 및 출력 채널의 수가 동일한 것이며 각 채널 고유의 Spatial 정보만을 사용하여 필터를 학습하게 된다. 결과적으로 입력 채널 수 만큼 그룹을 나눈 Grouped Convolution과 같아진다. Grouped Convolution 은 아래에서 설명한다.

```python
torch.nn.Conv2d(in_channels, in_channels, kernel_size=kernel_size, groups=in_channels)
```

## Depthwise Separable Convolution
위에서 설명된 Depthwise Convolution과 매우 유사하다. Depthwise convolution 연산을 수행한 뒤, 채널의 출력값을 하나의값으로 합치는 특징을 가지고 있다. 일반적인 depthwise convolution과 달리, spatial feature와 channelwise feature 정보를 모두 고려하여 연산이 가능하지만, 일반 convolution보다 연산량과 parameter의 개수가 적다는 장점이 있다. 아래 코드처럼 추가적인 convolution을 진행하여 하나의 채널로 압축하는 과정을 거쳐 결과를 계산한다.

<img src="{{page.img_pth}}depthwise_separable_conv.png" width="500">


```python
torch.nn.Conv2d(in_channels, in_channels, kernel_size=kernel_size, groups=in_channels)

torch.nn.Conv2d(in_channels, out_channels, kernel_size=1)
```

## Deformable Convolution
일반 convolution 연산과는 많이 다른 기법이다. 마이크로소프트에서 제안한 [Deformable Convolutional Networks](https://arxiv.org/abs/1703.06211)에서 처음 나온 개념이다. Convolution과 pooling과 같은 일반적인 기법들은 기하학적으로 일정한 패턴을 가지는 연산이기 때문에 복잡한 형상에 대해서는(회전, 크기 등) 유연하게 대처할 수 없다는 단점을 언급했다. 하나의 filter를 사용하게 되면 receptive field가 고정이 되고, 이 filter의 사이즈는 사람이 직접 설계하기 때문에 적절한 크기를 정하는데 있어서 추가적인 작업이 필요하게 된다. 일반적인 기법들은 필터의 weight를 어떻게 구할지에 대해서 초점을 맞추었다면, 해당 논문은 어느 위치의 데이터를 사용할지에 대해 초점을 맞추었다. 차근차근 알아보자.

기존 convolution은 두가지 스텝으로 이루어져 있다.

- sampling using a regular grid \\(R\\) over the input feature map \\(x\\)
- summation of sampled values weighted by \\(w\\)

여기서 \\(R\rightarrow\\)receptive field size & dilation 이다.

\\(R={(-1,-1), (-1,0),\ldots, (0, 1), (1, 1)}\rightarrow 3\times 3\\) convoltuion with dilation 1

<img src="{{page.img_pth}}deform_conv.png" width="320">


원점 기준으로 왼쪽 위 좌표부터 오른쪽 아래 좌표까지의 set이다. 그리고 \\(y\\)를 output feature map이라고 하면 일반적인 convolution은 아래와 같다(위 그림의 a).

\\[
    y(p_0)=\sum_{p_n\in R} w(p_n)\cdot x(p_0+p_n) 
\\]

이와 다르게 Deformable convolution은 다음과 같다(위 그림의 b, c, d).

$$
    \{\Delta p_n:n=1,\ldots,\lvert R\rvert \} \rightarrow \text{offsets augemting} R
$$

$$
    y(p_0)=\sum_{p_n\in R} w(p_n)\cdot x(p_0+p_n\color{Red}{+\Delta p_n}) 
$$

\\(\Delta p_n\\)의 offset을 더해주었을 때 b 그림처럼 계산된 픽셀의 좌표값이 그리드 중심으로 계산된다는 보장이 없다(이미지는 픽셀단위의 그리드이기 때문). 따라서 bilinear interpolation을 사용하여 보정을 해준다.

$$
    x(p) = \sum_q G(q, p)\cdot x(q) \rightarrow \text{bilinear interpolation}
$$

- \\(p \rightarrow\\) an arbitrary (fractional) location (e.g., \\(p=p_0+p_n+\Delta p_n\\))
- \\(q\rightarrow\\) enumerates all integral spatial locations in the feature map \\(x\\)
- \\(G(q, p)=g(q_x,p_x)\cdot g(q_y,p_y)\rightarrow\\) non-zero only for a few \\(q\\)'s
- \\(g(a, b) = max(0, 1-\lvert a-b \rvert)\\)

<img src="{{page.img_pth}}deform_conv2.png" width="420">

위 그림은 deformable convolution을 시각화한 그림이다. 두가지 단계로 나눌 수 있는데, convolution 연산을 통해(초록색) offset field를 먼저 계산하게 된다. 채널의 개수는 \\(2N (N=\lvert R\rvert)\\)개가 되는데, 하나의 offset마다 2차원 벡터값을 가지고 있기 때문이다. 위 그림에서 convolution 게산을 마친 초록색 offset field의 데이터 하나의 값은 커널 elemet의 개수(\\(N\\))와 차원의 개수(2)의 곱 값의 채널값을 가지게 된다. 계산된 offset(\\(\Delta p_n\\)) 값을 가지고 deformable convolution 연산을 수행하면 된다. 

<img src="{{page.img_pth}}deform_conv_viz.webp" width="420">

학습시에 deformable convolution 필터와 offset 필터를 동시에 학습할 수 있다는 것이 큰 장점이다. 또한, 기존 모델을 살짝만 바꾸어도 동작이 수월하고, one-stage로 동작하는 방식인 점을 장점으로 꼽았다. 위 그림과 같이 배경과 같은 큰 객체를 탐지할 때에는 receptive field가 넓어지고, 자동차와 같은 사물을 탐지할 때에는 receptive field가 좁아지는 것을 볼 수 있다. Offset이 loss를 최소화 하는 방향으로 학습 가능한 parameter이기 때문에 유연한 receptive field를 사용하여 feature extraction이 더 수월하게 될 수 있다. 일반적으로 object detection이나 segmentatin의 경우 pretraine model을 사용하는 경우가 많기 때문에 마지막 1~3 레이어에 deformable convolution을 적용하여 transfer learning을 진행한다고 한다. 당연히 기존 convolution 연산보다 연산량이 많아진다는 단점이 있지만, 그만큼 성능 향상이 있다고 한다. 

---
참고자료

- *<https://m.blog.naver.com/PostView.nhn?blogId=laonple&logNo=221000648527&proxyReferer=https:%2F%2Fwww.google.com%2F>*

- *<https://blog.naver.com/PostView.nhn?blogId=worb1605&logNo=221386398035&categoryNo=27&parentCategoryNo=0&viewDate=&currentPage=1&postListTopCurrentPage=1&from=search>*

- *<https://www.slideshare.net/ssuser6135a1/ss-106656779>*

- *<https://github.com/vdumoulin/conv_arithmetic/blob/master/README.md>*

- *<https://eehoeskrap.tistory.com/431>*