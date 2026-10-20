---
title: GNN 기반 MLIP에서 Universal MLIP까지
date: 2026-06-23 12:00:00 +0900
categories: [AI, Graph]
tags: [mlip, interatomic potential, graph neural network, equivariance, nequip, mace, m3gnet, chgnet, sevennet, universal mlip, foundation model]
use_math: true
---

## MLIP

원자 수준 시뮬레이션에서 가장 정확한 방법은 DFT 같은 양자역학 계산이다.
하지만 계산 비용이 원자 수의 세제곱에 가깝게 늘어나기 때문에, 현실적으로는 수백 개 원자, 수십 ps 정도가 한계이다.
반대로 classical force field는 수백만 개 원자도 돌릴 수 있지만, 사람이 정한 함수 형태에 묶여 있어서 정확도와 범용성이 떨어진다.

machine-learning interatomic potential(MLIP)은 이 둘 사이를 메우려는 시도이다.
DFT로 계산한 에너지와 힘을 학습해서, DFT에 가까운 정확도로 classical force field에 가까운 속도를 내는 것이 목표이다.

### Behler-Parrinello 이후의 기본 구조

MLIP의 기본 틀은 Behler & Parrinello(2007)에서 거의 정해졌다.
전체 에너지를 원자별 에너지의 합으로 쓰고, 각 원자의 에너지는 cutoff \\(r_c\\) 안의 주변 환경만 보고 신경망으로 예측한다.

$$
E = \sum_i E_i\left(\{ \mathbf{r}_{ij} \}_{r_{ij} < r_c}\right), \qquad \mathbf{F}_i = -\frac{\partial E}{\partial \mathbf{r}_i}
$$

이렇게 하면 원자 수가 몇 개든 같은 모델을 쓸 수 있고, 힘은 에너지를 좌표로 미분해서 얻으므로 에너지 보존도 자연스럽게 만족한다.
이 구조는 지금의 universal MLIP까지 거의 그대로 이어진다.

### 대칭성

MLIP가 반드시 지켜야 하는 성질이 있다. 분자를 통째로 회전시키거나 평행 이동해도 에너지는 변하면 안 되고, 힘은 분자와 같이 회전해야 한다.
같은 원소끼리 원자 번호를 바꿔 붙이는 것도 에너지에 영향을 주면 안 된다. ([Permutation Invariance](../permute-equivar-invar-graph) 참고)

$$
E(R\mathbf{r}) = E(\mathbf{r}), \qquad \mathbf{F}(R\mathbf{r}) = R\,\mathbf{F}(\mathbf{r})
$$

이게 왜 중요한지 간단한 toy 문제로 확인해 보자.
원자 3개짜리 분자의 에너지를 두 가지 모델로 학습시켰는데, 학습 데이터는 모두 **한 방향**으로 놓인 분자뿐이다.

* model on distances: 원자 사이의 거리 3개를 입력으로 받는다
* model on raw x, y coordinates: 원자 좌표를 그대로 입력으로 받는다

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_rotation.webp" alt="Rotation invariance" width="760">
  <p>분자를 회전시키면 실제 에너지는 그대로이고 힘(화살표)은 분자와 같이 돈다. 거리만 보는 모델은 이를 그대로 따르지만, 좌표를 그대로 보는 모델은 학습한 방향에서 조금만 벗어나도 에너지가 크게 틀어진다.</p>
</div>

좌표를 그대로 넣은 모델은 학습한 방향 근처에서만 맞고, 30도만 돌려도 에너지가 엉뚱하게 나온다.
"회전해도 에너지는 같다"는 사실을 데이터로 배우려면 모든 방향의 데이터가 필요하지만, 거리처럼 처음부터 회전에 불변인 입력을 쓰면 이 문제가 사라진다.

그래서 초기 MLIP들은 원자 주변 환경을 회전, 이동, 순서에 불변인 **descriptor**(예: symmetry function)로 바꿔서 신경망에 넣었다.
문제는 이 descriptor를 사람이 설계해야 하고, 원소 종류가 늘어날수록 descriptor의 수가 빠르게 늘어난다는 것이다.
그래서 대부분 특정 물질 하나, 많아야 원소 몇 개짜리 시스템을 위한 맞춤형(bespoke) 모델로 만들어졌다.

## GNN으로 넘어가기

원자 구조는 자연스럽게 그래프로 볼 수 있다.
원자를 node로, cutoff 안에 있는 원자 쌍을 edge로 두면, [Message Passing](../message-passing-neural-network)이나 [GCN](../graph-convolution)에서 정리한 GNN 구조를 그대로 쓸 수 있다.
descriptor를 사람이 만드는 대신, 신경망이 이웃의 정보를 모으면서 표현을 스스로 학습하는 것이다.

### SchNet

Schutt et al.(2017)의 **SchNet**은 원자 사이의 거리를 연속적인 필터로 바꿔서 convolution을 하는 continuous-filter convolution을 제안하였다.
이미지처럼 격자 위에 있지 않은 원자 데이터에도 convolution을 쓸 수 있게 된 것이다.
에너지와 힘을 함께 학습했고, 힘은 \\(\mathbf{F} = -\partial E / \partial \mathbf{r}\\)로 구해서 에너지 보존을 만족하였다.

### CGCNN

결정 구조로 처음 눈을 돌린 것은 Xie & Grossman(2018)의 **CGCNN**(Crystal Graph Convolutional Neural Network)이다.
결정은 주기 경계 조건 때문에 같은 원자 쌍이 여러 번 연결될 수 있어서, 이를 여러 개의 edge를 허용하는 multigraph로 표현하였다.

CGCNN은 Materials Project의 약 4만 6천 개 물질로 형성 에너지, band gap 등 8가지 물성을 예측했고, 형성 에너지는 약 2만 8천 개로 학습해서 MAE 0.039 eV/atom을 얻었다.
다만 CGCNN은 **interatomic potential이 아니다.** 안정한 구조 하나를 넣으면 물성 값 하나를 내놓는 모델이고, 힘은 예측하지 않는다.
이후의 MEGNet(Chen et al., 2019)도 온도 같은 전역 정보를 담는 global state를 추가했지만 마찬가지로 물성 예측 모델이었다.

그래도 "원소 종류에 상관없이 하나의 그래프 모델로 수만 개의 결정을 학습할 수 있다"는 것을 보여주었다는 점에서, 이후 universal MLIP의 출발점이 되었다.

### Receptive field

GNN MLIP에서 중요한 개념이 하나 있다. message passing을 한 번 할 때마다 원자가 "볼 수 있는" 범위가 cutoff만큼 넓어진다는 것이다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_receptive_field.webp" alt="Receptive field of message passing" width="460">
  <p>layer를 하나 쌓을 때마다 이웃의 이웃 정보가 전달되어, 가운데 원자의 receptive field가 cutoff의 배수로 넓어진다.</p>
</div>

layer가 \\(T\\)개이면 receptive field는 대략 \\(T \cdot r_c\\)가 된다.
더 먼 거리의 상호작용을 표현할 수 있다는 장점이 있지만, 뒤에서 보듯이 계산량과 병렬화에서는 큰 부담이 된다.

## Equivariance: NequIP와 MACE

SchNet 같은 초기 GNN은 거리처럼 회전에 **불변인 값(scalar)**만 주고받았다.
하지만 원자 사이의 방향 정보를 버리면, 각도처럼 중요한 기하학적 정보를 간접적으로만 배울 수밖에 없다.

### NequIP

Batzner et al.(2022)의 **NequIP**는 node feature에 scalar뿐 아니라 vector, 그리고 더 높은 차수의 tensor까지 담았다.
이 feature들은 구조를 회전시키면 같이 회전하는, 즉 **equivariant**한 값이다.
spherical harmonics와 tensor product를 이용해서, 회전에 대해 올바르게 변환되는 연산만으로 message passing을 구성하였다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_nequip_fig1.webp" alt="NequIP architecture" width="760">
  <p>NequIP의 구조. 각 원자는 \(l = 0, 1, 2, \ldots\)의 feature를 갖고, convolution에서 거리에 대한 radial 함수와 방향에 대한 spherical harmonics를 tensor product로 결합한다. (Batzner et al., 2022, Fig. 1, CC BY 4.0)</p>
</div>

가장 큰 장점은 **데이터 효율**이다. NequIP는 1000개 이하, 경우에 따라 100개 정도의 DFT 계산만으로도 정확한 potential을 만들었다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_nequip_fig5.webp" alt="NequIP learning curves" width="460">
  <p>물 데이터에 대한 학습 곡선. scalar만 쓰는 \(L = 0\) 모델보다 vector, tensor feature를 쓰는 \(L \geq 1\) 모델의 오차가 훨씬 낮고, 데이터가 늘어날 때 오차가 줄어드는 기울기도 더 가파르다. (Batzner et al., 2022, Fig. 5, CC BY 4.0)</p>
</div>

equivariant feature를 끄면(\\(L = 0\\)) 사실상 SchNet 같은 invariant 모델이 되는데, 이 경우 학습 곡선의 기울기가 -0.106으로 \\(L \geq 1\\)(약 -0.24 ~ -0.26)보다 훨씬 완만하다.
방향 정보를 직접 다루는 것이 단순히 오차를 조금 줄이는 것이 아니라, 데이터를 쓰는 효율 자체를 바꾼다는 것이다.

### MACE

NequIP의 message는 원자 두 개 사이의 정보(2-body)를 기본으로 한다.
세 원자 사이의 각도 같은 고차(many-body) 상호작용은 layer를 여러 번 쌓아야 간접적으로 표현되기 때문에, 4~6개의 layer가 필요했다.
layer가 많으면 계산이 느려지고, 앞에서 본 receptive field도 커진다.

Batatia et al.(2022)의 **MACE**는 message 자체를 고차로 만들었다.
먼저 이웃 정보를 모은 feature \\(A\\)를 만든 다음, 이 feature를 자기 자신과 여러 번 tensor product 해서 3-body, 4-body 정보를 한 번에 만든다.
모든 원자 세 쌍, 네 쌍을 직접 더하지 않아도 되기 때문에, 고차 정보를 2-body와 비슷한 비용으로 얻을 수 있다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_mace_fig1.webp" alt="MACE accuracy vs number of layers" width="760">
  <p>3BPA 분자에서 layer 수에 따른 오차. 2-body message를 쓰는 NequIP, BOTNet은 4~5개 layer까지 계속 좋아지지만, MACE는 2개 layer에서 이미 수렴한다. (Batatia et al., 2022, Fig. 1)</p>
</div>

4-body message를 쓰는 MACE는 layer 2개로 충분했고, 그 결과 NequIP보다 정확하면서도 약 4배 빨랐다(A100에서 24.3 ms vs 103.5 ms).
layer가 적다는 것은 receptive field가 작다는 뜻이기도 해서, 큰 시스템으로 확장하기에도 유리하다.

### 큰 시스템으로: 병렬화

정확한 GNN MLIP가 나와도, 수십만 개 원자의 MD를 돌리려면 GPU 여러 개를 써야 한다.
LAMMPS 같은 MD 코드는 공간을 여러 영역으로 나누고, 각 GPU가 자기 영역의 원자와 경계 근처의 ghost 원자를 함께 계산하는 spatial decomposition을 쓴다.

문제는 receptive field이다. layer가 \\(T\\)개이면 ghost 영역도 \\(T \cdot r_c\\)만큼 두꺼워야 해서, 중복 계산이 엄청나게 늘어난다.
Park et al.(2024)의 **SevenNet**은 ghost 영역을 \\(r_c\\)로 유지하는 대신, **layer마다** 경계의 feature를 주고받는 방법을 택했다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_sevennet_fig2.webp" alt="SevenNet parallel algorithm" width="560">
  <p>SevenNet의 병렬 알고리즘. 처음에 위치와 원소 정보를 주고받고, 이후 message passing layer마다 ghost 원자의 feature \(h\)를 주고받는다. 힘을 계산할 때는 반대 방향으로 gradient를 주고받는다. (Park et al., 2024, Fig. 3)</p>
</div>

* forward: 처음에 위치와 원소를 주고받고, layer마다 ghost 원자의 feature를 \\(T - 1\\)번 주고받는다
* backward(힘 계산): 에너지의 gradient를 반대 방향으로 \\(T - 1\\)번 주고받고, 마지막에 부분 힘을 합친다

이 방법으로 32개의 GPU에서 약 15만 개 원자까지 효율적으로 확장했고, Si<sub>3</sub>N<sub>4</sub> 비정질 구조 11만 2천 개 원자의 melt-quench 시뮬레이션을 GPU 8개로 수행하였다.
참고로 Allegro(Musaelian et al., 2023)는 아예 message passing을 하지 않는 strictly local 구조로 같은 문제를 풀어서, 1억 개 원자의 시뮬레이션을 보여주었다.

## Universal MLIP

여기까지의 MLIP는 대부분 **시스템마다 새로 학습하는** 모델이었다.
실리콘을 연구하려면 실리콘 데이터로, 물을 연구하려면 물 데이터로 모델을 새로 만들어야 했다.
그렇다면 주기율표 전체를 하나의 모델로 다룰 수는 없을까?

### M3GNet

Chen & Ong(2022)의 **M3GNet**은 89개 원소를 다루는 universal potential을 처음으로 제시하였다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_m3gnet_fig1.webp" alt="M3GNet architecture" width="760">
  <p>M3GNet의 구조. 원자 쌍(bond)뿐 아니라 세 원자 사이의 각도(three-body) 정보로 bond를 업데이트하고, 원자 에너지의 합으로 전체 에너지를, 그 미분으로 힘과 stress를 얻는다. (Chen & Ong, 2022, Fig. 1, arXiv version, CC BY 4.0)</p>
</div>

핵심은 모델보다 **데이터**였다.
Materials Project는 수많은 결정 구조에 대해 DFT로 구조 최적화(relaxation)를 해왔는데, 그 과정의 중간 구조들(ionic step)에도 에너지, 힘, stress가 모두 계산되어 있다.
M3GNet은 이 relaxation 경로에서 6만 2천여 개 화합물, 18만 7천여 개 구조를 모은 MPF 데이터셋으로 학습하였다.

그 결과 에너지 0.035 eV/atom, 힘 0.072 eV/\\(\mathring{\mathrm{A}}\\)의 오차를 얻었고, 3100만 개의 가상 결정 구조를 screening해서 안정할 것으로 예측된 상위 2000개 중 1578개가 DFT로 안정한 것으로 확인되었다.

### CHGNet

Deng et al.(2023)의 **CHGNet**은 데이터를 한 단계 더 키웠다.
Materials Project의 relaxation 경로를 더 넓게 모아 약 14만 6천 개 화합물, 158만 개 구조로 이루어진 **MPtrj** 데이터셋을 만들었다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_chgnet_fig2.webp" alt="MPtrj element distribution" width="680">
  <p>MPtrj 데이터셋의 원소 분포. 158만 개의 에너지, 약 4900만 개의 힘 성분, 약 790만 개의 자기 모멘트 라벨을 포함한다. (Deng et al., 2023, Fig. 2, CC BY 4.0)</p>
</div>

CHGNet의 또 다른 특징은 에너지, 힘, stress에 더해 **자기 모멘트**까지 학습한다는 것이다.
자기 모멘트는 전자의 오비탈 점유 상태를 반영하기 때문에, 원자의 전하 상태(예: Fe<sup>2+</sup>와 Fe<sup>3+</sup>)를 구분하는 단서가 된다.
40만 개 정도의 parameter로 에너지 30 meV/atom, 힘 77 meV/\\(\mathring{\mathrm{A}}\\)의 오차를 얻었다.

이후 MPtrj는 universal MLIP의 표준 학습 데이터가 되었다.
MACE-MP-0(Batatia et al.)는 MACE 구조를 MPtrj로 학습해서 물, 촉매, MOF, 배터리, 단백질까지 다양한 시스템에서 안정적인 MD를 보여주었고, SevenNet-0도 Materials Project의 relaxation 데이터로 학습해서 에너지 25 meV/atom, 힘 0.070 eV/\\(\mathring{\mathrm{A}}\\)의 오차를 얻었다.
universal MLIP들은 Matbench Discovery(Riebesell et al., 2025) 같은 benchmark에서 약 25만 개의 가상 결정 구조의 안정성을 얼마나 잘 맞추는지로 비교되기 시작했다.

### 데이터를 키우면 계속 좋아질까?

Merchant et al.(2023)의 **GNoME**는 이 질문에 답을 주었다.
active learning으로 구조를 탐색하면서 데이터를 키웠고, 그 과정에서 220만 개의 새로운 안정 구조 후보를 찾았다.
같은 데이터로 NequIP potential을 학습시키자, 데이터가 늘어날수록 성능이 **power law**로 꾸준히 좋아졌다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_gnome_fig3.webp" alt="GNoME scaling of interatomic potentials" width="680">
  <p>학습 데이터의 크기에 따른 potential의 성능. (a) superionic conductor 분류 오차, (b) 처음 보는 구조에 대한 zero-shot 힘 오차가 데이터가 늘어날수록 꾸준히 줄어든다. (c, d) 사전학습된 GNoME potential은 처음 보는 시스템에서도 처음부터 학습한 모델보다 정확하다. (Merchant et al., 2023, Fig. 3, CC BY 4.0)</p>
</div>

특히 (c)를 보면, 사전학습한 모델은 해당 시스템의 데이터를 하나도 보지 않고도(zero-shot) 수백 개 데이터로 처음부터 학습한 기존 모델보다 정확했고, 소량의 데이터로 fine-tuning하면 훨씬 더 좋아졌다.
universal MLIP가 단순히 "넓게 쓸 수 있는 모델"이 아니라, 다른 문제를 위한 **pretrained model** 역할을 할 수 있다는 것이다.

### 한계

하지만 Materials Project의 relaxation 경로는 대부분 **평형 근처의 안정한 구조**이다.
그래서 이 데이터로 학습한 모델들은 에너지가 높은 구조(결함, 이온 이동, 원자가 매우 가까운 구조)의 에너지와 힘을 체계적으로 과소평가하는 경향이 있다.
또한 결정 데이터만으로 학습했기 때문에 분자나 표면 같은 다른 도메인에서는 정확도가 떨어진다.

## 데이터의 확장과 Foundation model

이 한계를 넘기 위해 데이터가 한 번 더 크게 늘어났다.
Meta의 **OMat24**(Barroso-Luque et al., 2024)는 평형에서 멀리 떨어진 구조를 대거 포함한 1억 1800만 개 구조의 데이터셋을 공개했고, 이 데이터가 앞의 softening 문제를 상당 부분 완화한다는 것을 보였다.
분자(OMol25, SPICE), 표면과 촉매(OC20, OC22), MOF(ODAC23) 같은 다른 도메인의 대규모 데이터셋도 함께 늘어났다.

그런데 이 데이터들을 그냥 합쳐서 학습할 수는 없다. 데이터셋마다 **DFT 계산 설정이 다르기** 때문이다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_omni_fig1.webp" alt="Training data across domains and levels of theory" width="760">
  <p>(a) universal MLIP 학습에 쓰이는 데이터셋들의 도메인(가로)과 계산 수준(세로). (b) SevenNet-Omni가 학습한 task embedding의 PCA. 같은 functional을 쓰는 데이터셋끼리 모인다. (Kim et al., 2026, Fig. 1, CC BY 4.0, 일부 panel만 발췌)</p>
</div>

결정 데이터는 대부분 PBE(+U), 일부는 r<sup>2</sup>SCAN, 분자 데이터는 \\(\omega\\)B97M 같은 hybrid functional로 계산되어 있다.
같은 구조라도 functional이 다르면 에너지가 다르기 때문에, 이 데이터들을 하나의 정답으로 취급하면 모델이 혼란스러워진다.
그래서 최근의 foundation model들은 공통의 표현을 공유하면서도 계산 설정마다 다른 출력을 낼 수 있는 구조를 쓴다.

### SevenNet-Omni: task embedding

Kim et al.(2026)의 **SevenNet-Omni**는 parameter를 모든 데이터가 공유하는 부분 \\(\theta_C\\)와 계산 설정(task)마다 다른 부분 \\(\theta_T\\)로 나누었다.

$$
\text{DFT}_T(\mathcal{G}) \approx f(\mathcal{G}; \theta_C, \theta_T) = f(\mathcal{G}; \theta_C, \mathbf{0}) + \theta_T^\top R(\mathcal{G}; \theta_C, \theta_T)
$$

첫 번째 항은 모든 task가 공유하는 "공통 PES"이고, 두 번째 항은 task별 보정이다.
여기서 중요한 질문이 생긴다. PBE로 학습한 결정 데이터의 지식이, hybrid functional로만 학습한 분자에 대해 PBE 채널로 예측할 때 얼마나 잘 전달될까? 이것을 **cross-domain transfer**라고 부른다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_omni_fig2.webp" alt="Cross-domain transfer ablation" width="760">
  <p>(c) task별 보정이 크면 공통 PES가 실제 PES에서 멀어진다. task별 parameter를 regularization하고, 여러 도메인의 구조를 같은 설정으로 다시 계산한 domain-bridging set(DBS)을 추가하면 공통 PES가 두 도메인을 모두 잘 표현하게 된다. (d) 학습 범위 밖인 Molecule@GGA의 힘 오차가 0.157에서 0.048 eV/\(\mathring{\mathrm{A}}\)까지 줄어든다. (Kim et al., 2026, Fig. 1, CC BY 4.0, 일부 panel만 발췌)</p>
</div>

* task별 parameter \\(\theta_T\\)에만 L2 regularization을 걸어서, 지식이 task별 보정이 아니라 공통 PES에 담기도록 유도한다
* 분자, 표면, MOF 구조 일부(전체의 약 0.1%)를 결정 데이터와 **같은 DFT 설정**으로 다시 계산한 domain-bridging set을 추가한다

이렇게 해서 15개 데이터셋, 약 2억 4천만 개의 구조로 학습한 SevenNet-Omni는 결정뿐 아니라 분자, 표면, MOF에서도 고르게 높은 정확도를 보였다.
r<sup>2</sup>SCAN 데이터는 PBE 데이터의 0.8%에 불과했지만, PBE 데이터에서 지식이 전달되어 r<sup>2</sup>SCAN 채널의 정확도도 다른 모델보다 높았다.

### MACE-MH-1: multi-head와 replay

같은 문제를 Batatia et al.(2025)은 조금 다른 방식으로 풀었다.

<div style="text-align: center;">
  <img src="{{page.img_pth}}umlip_ref_macecross_fig1.webp" alt="MACE multi-head fine-tuning" width="680">
  <p>(a) OMat24로 MACE를 사전학습한 뒤, (b) 분자(OMol), 표면(OC20) 등 다른 데이터셋마다 별도의 readout head를 두고 함께 fine-tuning한다. 이때 OMat24 데이터를 replay해서 원래의 PBE head를 유지한다. (Batatia et al., 2025, Fig. 1)</p>
</div>

* 모델의 몸통(backbone)은 모두 공유하고, 데이터셋마다 마지막 readout만 따로 둔다 (multi-head)
* 새 도메인을 학습하는 동안 OMat24 데이터를 섞어서(replay) 원래 지식을 잊지 않게 한다
* 최종적으로는 PBE head 하나를 모든 도메인에 쓴다

task별 parameter를 layer 곳곳에 두는 SevenNet-Omni, UMA와 달리 task별 부분을 마지막 readout으로 최소화한 것이다.
접근은 다르지만, 두 연구 모두 결론은 비슷하다. **데이터를 많이 모으는 것만큼, 여러 task가 parameter를 어떻게 공유하도록 설계하느냐가 cross-domain transfer를 좌우한다.**

참고로 Meta의 UMA(Wood et al., 2025)는 여러 개의 expert 가중치를 조성에 따라 섞는 mixture of linear experts 구조로, 약 5억 개 구조를 학습한 14억 parameter 모델(실제로 계산에 쓰이는 parameter는 약 5천만 개)을 만들었다.

## 정리

| 시기 | 모델 | 핵심 아이디어 | 학습 데이터 |
|------|------|-------------|-----------|
| 2007 | Behler-Parrinello | 원자 에너지의 합, 사람이 설계한 descriptor | 시스템별 DFT |
| 2017 | SchNet | continuous-filter convolution, 에너지 보존 힘 | 분자 (QM9, MD17) |
| 2018 | CGCNN | crystal graph, 물성 예측 (힘 없음) | MP 약 4만 6천 개 |
| 2022 | NequIP | E(3)-equivariant feature, 높은 데이터 효율 | 시스템별 100~1000개 |
| 2022 | MACE | 고차 message, 2개 layer로 충분 | 시스템별 |
| 2022 | M3GNet | 89개 원소 universal potential, three-body | MPF 약 18만 7천 개 |
| 2023 | CHGNet | MPtrj, 자기 모멘트 | MPtrj 약 158만 개 |
| 2023 | GNoME | 데이터 scaling, zero-shot | active learning |
| 2024 | OMat24 | 평형에서 먼 구조 | 약 1억 1800만 개 |
| 2025~ | SevenNet-Omni, MACE-MH-1, UMA | 여러 도메인, 여러 계산 설정 | 수억 개 |

흐름을 다시 보면, 처음에는 **하나의 시스템을 잘 맞추는 모델**을 만드는 것이 목표였다.
equivariance로 적은 데이터에서도 정확해졌고, Materials Project의 relaxation 데이터로 주기율표 전체를 다루는 universal MLIP가 등장했다.
이제는 결정, 분자, 표면을 아우르고 서로 다른 계산 설정까지 하나로 묶는 foundation model로 가고 있다.

## 한 문장으로 요약

MLIP는 사람이 설계한 descriptor에서 GNN으로, invariant feature에서 equivariant feature로, 시스템별 모델에서 universal 모델로 발전해 왔으며, 지금은 서로 다른 도메인과 계산 설정의 데이터를 하나로 묶는 foundation model이 다음 단계가 되고 있다.

---

## 참고자료

- *J. Behler and M. Parrinello, Generalized Neural-Network Representation of High-Dimensional Potential-Energy Surfaces, Phys. Rev. Lett. 98, 146401 (2007). <https://doi.org/10.1103/PhysRevLett.98.146401>*
- *K. T. Schutt et al., SchNet: A continuous-filter convolutional neural network for modeling quantum interactions, NeurIPS (2017). <https://arxiv.org/abs/1706.08566>*
- *T. Xie and J. C. Grossman, Crystal Graph Convolutional Neural Networks for an Accurate and Interpretable Prediction of Material Properties, Phys. Rev. Lett. 120, 145301 (2018). <https://doi.org/10.1103/PhysRevLett.120.145301>*
- *C. Chen et al., Graph Networks as a Universal Machine Learning Framework for Molecules and Crystals, Chem. Mater. 31, 3564 (2019). <https://doi.org/10.1021/acs.chemmater.9b01294>*
- *S. Batzner et al., E(3)-equivariant graph neural networks for data-efficient and accurate interatomic potentials, Nat. Commun. 13, 2453 (2022). <https://doi.org/10.1038/s41467-022-29939-5>*
- *I. Batatia et al., MACE: Higher Order Equivariant Message Passing Neural Networks for Fast and Accurate Force Fields, NeurIPS (2022). <https://arxiv.org/abs/2206.07697>*
- *A. Musaelian et al., Learning local equivariant representations for large-scale atomistic dynamics, Nat. Commun. 14, 579 (2023). <https://doi.org/10.1038/s41467-023-36329-y>*
- *Y. Park, J. Kim, S. Hwang and S. Han, Scalable Parallel Algorithm for Graph Neural Network Interatomic Potentials in Molecular Dynamics Simulations, J. Chem. Theory Comput. 20, 4857 (2024). <https://doi.org/10.1021/acs.jctc.4c00190>*
- *C. Chen and S. P. Ong, A universal graph deep learning interatomic potential for the periodic table, Nat. Comput. Sci. 2, 718 (2022). <https://doi.org/10.1038/s43588-022-00349-3>*
- *B. Deng et al., CHGNet as a pretrained universal neural network potential for charge-informed atomistic modelling, Nat. Mach. Intell. 5, 1031 (2023). <https://doi.org/10.1038/s42256-023-00716-3>*
- *A. Merchant et al., Scaling deep learning for materials discovery, Nature 624, 80 (2023). <https://doi.org/10.1038/s41586-023-06735-9>*
- *I. Batatia et al., A foundation model for atomistic materials chemistry, J. Chem. Phys. 163, 184110 (2025). <https://doi.org/10.1063/5.0297006>*
- *J. Riebesell et al., A framework to evaluate machine learning crystal stability predictions, Nat. Mach. Intell. 7, 836 (2025). <https://doi.org/10.1038/s42256-025-01055-1>*
- *L. Barroso-Luque et al., Open Materials 2024 (OMat24) Inorganic Materials Dataset and Models, arXiv:2410.12771. <https://arxiv.org/abs/2410.12771>*
- *J. Kim, J. You et al., Optimizing cross-domain transfer for universal machine learning interatomic potentials, Nat. Commun. 17, 3432 (2026). <https://doi.org/10.1038/s41467-026-70195-8>*
- *I. Batatia et al., Cross Learning between Electronic Structure Theories for Unifying Molecular, Surface, and Inorganic Crystal Foundation Force Fields, arXiv:2510.25380 (2025). <https://arxiv.org/abs/2510.25380>*
- *B. M. Wood et al., UMA: A Family of Universal Models for Atoms, arXiv:2506.23971 (2025). <https://arxiv.org/abs/2506.23971>*
