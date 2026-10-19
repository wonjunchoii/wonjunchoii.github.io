---
title: Pytorch의 Autograd Engine
date: 2024-03-20 13:37:00 +0800
categories: [AI, Pytorch]
tags: [pytorch, autograd, deep learning, machine learning, neural networks, gradient descent, backpropagation, computational graphs, pytorch tutorial]

use_math: true
---

## AutoGrad

### Backpropagation
딥러닝은 input값과 output값을 비교하며 둘의 차이만큼 연산식(parameter)를 수정해 나가는 과정이다. 이를 가능하게 하기 위해서 각 paremeter가 loss function에 얼마나 민감하게 반응하는지 역으로 계산하여 업데이트 해주게 된다. 

<img src="{{page.img_pth}}autograd_node.svg">

예를 들어, 위와 같이 하나의 노드만 있는 네트워크를 상상해보자. 첫번째 레이어에서의 계산은, 

\\[
    z^{(L)} = w^{(L)}a^{(L-1)}+b^{(L)}
\\]

과 같이 가중치 \\(w^{(L)}\\)를 곱하고 편향 \\(b^{(L)}\\)을 더해주어 계산된다. 그런 후, ReLU나 sigmoid와 같은 비선형 함수를 적용해 주게 되면 아래와 같이 output이 계산된다.

\\[
    a^{(L)} = \sigma(z^{(L)})   
\\]

그리고 계산을 간단히 하기 위해 손실함수로서 predicted output과 target output의 차이의 제곱으로 나타낸다.

\\[
    \text{Cost} \rightarrow (a^{(L)}-y)^2
\\]

여기서 딥러닝의 목표는 cost function이 얼마나 가중치의 변화에 민감한지를 알아내는 것이다. 다른 말로 손실함수 \\(C\\)의 가중치 \\(w^{L}\\)에 대한 미분값을 구하고자 하는 것이다. 위 네트워크를 생각해보면, \\(w^{L}\\)의 변화는 \\(z\\)를 변하게 하고, \\(z\\)의 변화는 \\(a^{(L)}\\)에 변화가 조금 생기도록 할수있다. 이 변화는 cost에 직접적인 영향을 미치게 된다. 각각의 변화를 chain rule로 설명해 보면 아래와 같다.

\\[
    \frac{\partial C_0}{\partial w^{(L)}} = \frac{\partial z^{(L)}}{\partial w^{(L)}} \frac{\partial a^{(L)}}{\partial z^{(L)}} \frac{\partial C_0}{\partial a^{(L)}}    
\\]

이처럼 이 경우에 세 비율을 곱하는 것으로 cost의 가중치에 작은 변화에 대한 민감도를 알 수 있다. 위 예시에서 각 비율을 계산하게 되면, 

$$
    \frac{\partial z^{(L)}}{\partial w^{(L)}} = a^{(L)}
$$


$$
    \frac{\partial a^{(L)}}{\partial z^{(L)}} 
    = \sigma'(z^{(L)})
$$


$$
    \frac{\partial C_0}{\partial a^{(L)}} = 2(a^{(L)}-y)
$$

이 모든 과정을 더욱더 복잡한 모델에서 동적으로 계산 할 수 있게 해주는 기능이 바로 pytorch의 `autograd`기능이다.

### The Engine
Pytorch 의 autograd 엔진은 변수가 계산되는 데에 사용되었던 모든 변수들에 대한 미분값을 구해 저장하면서 딥러닝의 forward 혹은 backward를 가능하게 해주는 기능이다. 개념적으로, 이 모든 기록을 `directed acyclic graph (DAG)`에 함수 오브젝트로 저장한다. Leaf node는 모든 input 텐서이고, root node는 output 텐서로 볼 수 있다. 계산 과정에서 나오는 모든 결과는 intermediate node로, 미분값을 저장하지는 않는다. 과정을 간략히 정리해 보면,

**Forward pass**
- Multiply, Sum 등 요청된 연산을 수행하고, 결과 tensor를 계산한다
- DAG에 gradient function을 저장한다 

**Backward pass**
- 각 gradient function 으로부터 변화도를 계산한다
- 텐서의 gradient 변수(속성)에 계산 결과를 쌓는다
- 연쇄 법칙을 사용하여 모든 leaf node/tensor 까지 propagate 한다

글로 설명하면 어려울 수 있으니, 예제와 함께 보도록 하자.

### Examples
#### 첫번째 예제
```python
a = torch.tensor([1., 2., 3.], requires_grad=True)
b = torch.tensor([3., 3., 3.], requires_grad=True)

d = torch.tensor([4., 6., 10.], requires_grad=True)

c = a * b
e = c * d

ans = torch.sum(e)

ans.backward()
```

위 코드를 computational node 로 간단하게 표현하면 아래와 같다.

<img src="{{page.img_pth}}Autograd-3.webp" width="600">

그림을 보면, 연산을 통해 나온 결과 텐서들은 어떤 연산을 통해 나왔는지 grad_fn(빨간색)에 저장하게 된다. 각 grad_fn은 backward graph에서의 node를 가리키게 된다. 예를 들어 ans 텐서는 `sum_backward`라는 grad_fn을 저장하고 있고, 해당 객체는 backward graph의 다음 node이느 `mul_backward`를 가리키게 된다. 그 다음, e 텐서는 `mul_backward` 객체를 가지고 있고, 해단 객체는 그 다음 스텝인 `mul_backward`와 leaf node에게 미분값을 전달해 주기위한 `accumulate_grad`를 가리키고 있다. `ans.backward()`를 실행하게 되면, 파란색 화살표를 따라 미분값이 전파되게 되는데, `accumulate_grad`를 만나기 전까지 모든 미분 값들을 chain rule을 통해 전파해 주게 된다. 코드 결과와 비교해 보면 다음과 같다. 손계산과 일치하는 것을 볼 수 있다.

```console
backward() 전
a: tensor([1., 2., 3.], requires_grad=True), grad = None
b: tensor([3., 3., 3.], requires_grad=True), grad = None
c: tensor([3., 6., 9.], grad_fn=<MulBackward0>)
d: tensor([4., 6., 10.], requires_grad=True), grad = None
e: tensor([12., 36., 90.], grad_fn=<MulBackward0>)
ans: tensor([138.], grad_fn=<SumBackward0>)
=======================================================
backward() 후
a: tensor([1., 2., 3.], requires_grad=True), grad = tensor([12., 18., 30.])
b: tensor([3., 3., 3.], requires_grad=True), grad = tensor([4., 12., 30.])
c: tensor([3., 6., 9.], grad_fn=<MulBackward0>)
d: tensor([4., 6., 10.], requires_grad=True), grad = tensor([3., 6., 9.])
e: tensor([12., 36., 90.], grad_fn=<MulBackward0>)
ans: tensor([138.], grad_fn=<SumBackward0>)
```

#### 두번째 예제
위 예제와 동일한 코드이지만, e = c.detach() * d 연산을 수행해보자. Detach는 backward에서 어떤 영향을 미치게 될까? Detach는 새로운 텐서 객체로 분리하여 간단하게 텐서를 복사하고, `requires_grad` 속성을 False 로 설정하여 자동 미분 기능에서 제외 시키는 기능을 한다. 해당 텐서의 grad_fn은 None을 가리키고 있게 되어 backward propagation시 미분값이 흐르지 못하도록 한다. 아래 그림을 보면 초록색 박스로 표시 되어있는 부분만 역전파가 이루어지게 되고, c 텐서 이후로는 grad_fn이 None을 가리키고있기 때문에(추상적으로) 그 위로 흐르지 못하는 것을 볼 수 있다. 

<img src="{{page.img_pth}}Autograd-5.webp" width="600">

#### 세번째 예제
비슷한 예제이지만, 실제 linear 네트워크를 예시로 계산해 보자. 

```python
modelA = nn.Linear(10, 10)
modelB = nn.Linear(10, 10)
modelC = nn.Linear(10, 10)

x = torch.randn(1, 10)
a = modelA(x)
b = modelB(a.detach())
b.mean().backward()
print(modelA.weight.grad) # 여기서는 None

c = modelC(a)
c.mean().backward()
print(modelA.weight.grad) # 여기서는 tensor([...])
```

똑같이 modelA.weight.grad를 불러와도 첫번째는 None이 리턴되고, 두번째는 실제 미분값이 리턴된다. 그림을 그려보면 쉽게 이해가 된다. 

처음 계산시, b.mean() 텐서에서 backward 가 호출이 되고, backward graph를 따라가다 보면 modelB의 텐서가 leaf node이기 때문에 업데이트가 진행이 된다. a.detach() 텐서는 grad_fn이 없기 때문에 backward propagation이 종료되게 된다. 따라서 그 위로 modelA가 업데이트 되지 않게 되는 것이다.

하지만 두번째 계산 시, 연산은 a 텐서를 기점으로 오른쪽으로 흐르게 되고, c.mean().backward()를 통해 modelA가 업데이트가 되기 때문에 실제 gradient가 저장이 되게 되는 것이다. 이후에, optimizer에 업데이트를 원하는 leaf node 텐서들을 넣어주고 (i.e. optim.SGD(parameters, lr=0.01)), optim.step()을 실행하게 되면 전파되어 leaf node에 누적된 미분 값들중 파라미터로 넘겨진 텐서들에 learning rate(0.01)을 곱해주어 업데이트가 진행 되는 것이다.

<img src="{{page.img_pth}}Autograd-7.webp" width="600">

### 번외 - torch.detach()
`tensor.detach()`메소드는 backpropagation시 위 세번째 예시와 같이 그래프를 떼어 놓는 것과 같은 역할을 한다. 주의할 점은 `tensor.detach()`는 기존 텐서와 메모리 공유를 하며 requires_grad에 False를 해주는 기능이다. 따라서 모든 inplace연산은 기존 텐서에 영향을 줄 수 있으며 완전히 분리된 텐서를 얻기 위해서는 `tensor.clone().detach()`를 사용하면 된다. 

<img src="{{page.img_pth}}detach_clone.webp">

---
참고자료
- *<https://www.youtube.com/watch?v=MswxJw-8PvE&t=28s&ab_channel=ElliotWaite>*

- *<https://www.youtube.com/watch?v=tIeHLnjs5U8&t=432s&ab_channel=3Blue1Brown>*

- *<https://pytorch.org/blog/overview-of-pytorch-autograd-engine/>*

- *<https://pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html/>*