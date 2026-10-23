---
title: DCGAN 구현
date: 2024-01-10 21:25:00 +0900
categories: [AI, GAN]
tags: [gan, dcgan, generative model, deep learning, pytorch]
use_math: true
---
## DCGAN
[이전 포스트](../DCGAN)를 토대로 Deep Convolutional Generative Adversarial Networks(DCGAN)을 구현해 보았다. 기존 GAN 모델보다 Convolution 연산만을 사용하여 생성 정확도를 엄청나게 올릴 수 있었다고 한다. 원문은 [링크](https://arxiv.org/abs/1511.06434) 참조!

### Implement

<img src="{{page.img_pth}}dcgan_generator.png">

위 그림은 문헌에서 가져온 Generator의 구조이다. 모델의 input으로는 100차원의 1x1 벡터가 들어가게 되고, 각 layer를 거칠수록 output size가 커진다. 일반적인 convolution 연산은 output size가 작아지는데, 이 문헌은 최종 이미지를 생성하기 위해 `Transposed Conv`연산을 사용했다. 자세한 내용은 [conv 종류](../conv-types)에 관한 포스트에서 다루겠다. 간단하게 이미지로 표현하면, 아래와 같다.

<img src="{{page.img_pth}}transposed_conv.gif">

일반적으로 conv 연산은 kernel을 input 데이터와 convolution 연산을 해서 하나의 값이 나온다. 하지만 Transposed Conv는 그 반대로 하나의 값을 kernel과의 곱을 한 결과가 output 데이터가 된다 (간단한 경우). 하나의 예시로 stride=2, padding=0, kernel=3, input_size=2인 경우는 위의 gif 이미지와 같다. Convolution의 역 연산은 아니지만, 비슷한 개념으로 이루어지기 때문에, stride=2의 의미는 거꾸로 생각하면 stride 1/2이 된다. stride가 1/2이라는 말은 2번 움직여야 다음 데이터에 도달한다는 말이다. 위 gif에서 파란색 데이터의 한 원소에서 다음 원소까지 도달하는데 sliding이 2번 필요하기 때문에, kernel은 1/2씩 움직이는 개념이 된다.

<img src="{{page.img_pth}}dcgan_implement.png">

위 표는 문헌에서 제시한 모델의 가이드라인이다. 위 가이드라인을 따라 만들어보자.

#### Generator
{::options parse_block_html="true" /}
<details><summary markdown="span">Generator Code</summary>

```python
class Generator(nn.Module):
    def __init__(self, nc, nz, ngf):
        """
        Args:
            nc = number of channels of output
            nz = generator input dim
            ngf = feature map channel size
        """
        super().__init__()
        #B, C, H, W
        #input dim size torch.Size([None, 100, 1, 1])
        self.layer1 = nn.Sequential(
            nn.ConvTranspose2d(nz, ngf*8, kernel_size=4, stride=1, padding=0, bias=False),
            nn.BatchNorm2d(ngf*8),
            nn.ReLU()
        )
        self.layer2 = nn.Sequential(
            nn.ConvTranspose2d(ngf*8, ngf*4, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(ngf*4),
            nn.ReLU()
        )
        self.layer3 = nn.Sequential(
            nn.ConvTranspose2d(ngf*4, ngf*2, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(ngf*2),
            nn.ReLU()
        )
        self.layer4 = nn.Sequential(
            nn.ConvTranspose2d(ngf*2, ngf, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(ngf),
            nn.ReLU()
        )
        self.last = nn.Sequential(
            nn.ConvTranspose2d(ngf, nc, kernel_size=4, stride=2, padding=1, bias=False),
            nn.Tanh()
        )

    def forward(self, x):
        out = self.layer1(x)
        out = self.layer2(out)
        out = self.layer3(out)
        out = self.layer4(out)
        out = self.last(out)
        return out
```
</details>
<br/>
{::options parse_block_html="false" /}

Generator는 총 5개의 layer로 이루어져있다. 마지막 layer를 제외한 나머지 layer는 모두 `nn.ConvTranspose2d`, `nn.BatchNorm2d` 그리고 `nn.ReLU`를 사용하였다. 전의 Generator 그림에서 나타난 것처럼 첫 layer제외 모든 layer는 `stride = 2`를 사용하는 것을 이용해 나머지 kernel_size와 padding을 계산해 주면 된다. 각 layer를 통과 할 때마다 (H, W)가 두배로 늘어나고, stride를 생각해 준다면 `kernel_size = 4`, `padding = 1`이라는 결과를 얻을 수 있다.

마지막 layer는 `tanh`를 사용하여 -1 ~ 1 의 범위로 스케일링 하고, ReLU activation과 BatchNorm을 사용해서 안정성을 더한 것으로 보인다.

#### Discriminator
{::options parse_block_html="true" /}
<details><summary markdown="span">Discriminator Code</summary>

```python
class Discriminator(nn.Module):
    def __init__(self, nc, ndf):
        super(Discriminator, self).__init__()

        #input: B*nc*64*64
        self.layer1 = nn.Sequential(
            nn.Conv2d(nc, ndf, kernel_size=4, stride=2, padding=1, bias=False),
            nn.LeakyReLU(0.2)
        )
        self.layer2 = nn.Sequential(
            nn.Conv2d(ndf, ndf*2, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(ndf*2),
            nn.LeakyReLU(0.2)
        )
        self.layer3 = nn.Sequential(
            nn.Conv2d(ndf*2, ndf*4, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(ndf*4),
            nn.LeakyReLU(0.2)
        )
        self.layer4 = nn.Sequential(
            nn.Conv2d(ndf*4, ndf*8, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(ndf*8),
            nn.LeakyReLU(0.2)
        )
        self.last = nn.Sequential(
            nn.Conv2d(ndf*8, 1, kernel_size=4, stride=1, padding=0, bias=False),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        out = self.layer1(x)
        out = self.layer2(out)
        out = self.layer3(out)
        out = self.layer4(out)
        out = self.last(out)
        return out
```
</details>
<br/>
{::options parse_block_html="false" /}

Discriminator는 Generator와 비슷하지만 정 반대의 구조를 가지고 있다. 하지만 activation function으로 `nn.LeakyReLU`를 사용하고, 최종 결과 값을 sigmoid를 통해 참과 거짓을 도출한다.

### Mode Collapse
문헌에 나와있는 대로 parameter를 세팅해 주고 (learning rate, channels, beta, batch size, etc.), 학습을 진행해 보자. Dataset은 CelebA 데이터를 사용하고, 64x64의 사이즈로 resize 해주었다. 학습 결과를 보자.

<img src="{{page.img_pth}}model_collapse.jpg" width="512">

Discriminator의 loss가 100으로 수렴하고 Generator의 loss가 0으로 수렴했다. 학습이 더이상 이루어지지 않는다는 뜻이다. Generator는 가짜 이미지를 생성하여 Discriminator를 완벽하게 속이고 있고, Discriminator는 아예 구분하지 못한다는 뜻일 수도 있다. 반대로, Discriminator의 loss가 0으로, Generator의 loss가 그 반대로 수렴한다면 Discriminator가 진짜와 가짜 이미지를 완벽에 가깝게 분류할 수 있다는 뜻과 Generator가 너무 쉽거나 Discriminator를 속이지 못하는 데이터를 생성한다는 뜻이다.

이는 너무 깊은 모델로 인해 `gradient vanishing`이나 특정 feature만 학습하여 하나의 mode로 수렴하는 현상인 `mode collapse`현상일 가능성이 있다. 이를 방지하기 위해 문헌에서 쓰이는 채널 개수의 반만 사용하고, `transforms.RandomHorizontalFlip()`을 사용하여 이미지의 다양성을 늘려주었다. 아래는 직접 학습한 1~100 epochs 의 결과이다.

<img src="{{page.img_pth}}dcgan_to_100epochs.webp" width="256">

### Fréchet Inception Distance
기존에 GAN의 성능을 정량적으로 평가하는 방법은 사람이 눈으로 직접 평가하는 방법밖에 없었다. 사람이 눈으로 보고 판단하는 방법은 한계가 명확하다. 평가하는 사람의 주관이 들어갈 수 밖에 없고, 데이터가 많아질 경우 평가 소요 시간이 많이 늘어나게 된다. 이를 해결하고자 데이터를 정량적으로 평가하는 기법인 Fréchet Inception Distance(FID)가 나오게 된다.

FID는 GAN을 이용해 생성된 데이터의 집합과 실제 생성하고자 하는 데이터 분포의 거리를 계산한다. 거리가 가까울수록 좋은 질의 데이터로 판단할 수 있다. FID 값을 산출하기 위해 사용되는 모델은 [Inception v3 모델](https://arxiv.org/pdf/1512.00567v3.pdf)의 coding layer 값을 사용한다고 한다. Inception v3 모델은 아래 그림과 같다. 여기서 coding layer는 가장 마지막 2048 채널의 pooling layer로 이미지 클래스를 분류하는 레이어 직전의 레이어이다. 다른 pretrained 모델이라해도 분류직전의 layer 값을 사용하면 FID를 산출할 수 있다.

<img src="{{page.img_pth}}inception_v3.png">

Inception 모델을 사용해서 FID를 계산하는 원리는 [문헌](https://arxiv.org/pdf/1706.08500.pdf)을 참조. FID의 정의는 다음과 같다.

\\[
\text{FID} =\lvert\mu -\mu _{w}\rvert^{2}+\operatorname {tr} (\Sigma +\Sigma _{w}-2(\Sigma \Sigma _{w})^{1/2})
\\]

FID는 두 Gaussian 분포비교로 가정하며 \\(\mathcal{N}(\mu, \Sigma)\\)는 GAN과 같은 생성모델에서의 분포를, \\(\mathcal{N}(\mu _{w}, \Sigma _{w})\\)는 진짜 이미지의 분포를 나타낸다. FID는 이 두 분포의 거리를 구하는 것이다. 

Univariate의 경우를 생각해보자. Univariate인 경우에는 covariance의 대각선 이외의 성분이 모두 0이므로 \\(\Sigma = \begin{bmatrix}\sigma^{2} & 0 \cr 0 & \sigma^{2} \end{bmatrix}\\), \\(\Sigma_{w} = \begin{bmatrix}\sigma_{w}^{2} & 0 \cr 0 & \sigma_{w}^{2} \end{bmatrix}\\)로 놓고 계산해보면 다음의 distance로 표현된다.

\\[
\text{FID} = \lvert \mu - \mu_{w} \rvert^{2}+ \lvert \sigma - \sigma_{w} \rvert^{2}
\\]

위처럼 Univariate의 경우 두 분포의 평균, 편차의 차이를 각각 제곱하는 것과 같다. 단순 픽셀값을 비교하는 pixel distance와 다르게 데이터의 분포를 비교하므로 GAN의 평가 지표로 더 의미있게 쓰이는 것 같다.