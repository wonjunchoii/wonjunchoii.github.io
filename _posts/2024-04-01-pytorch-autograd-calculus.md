---
title: PyTorch의 Autograd Engine2 (Calculus)
date: 2024-04-01 17:13:00 +0900
categories: [AI, PyTorch]
tags: [pytorch, autograd, backpropagation, jacobian]
use_math: true
---

## AutoGrad
[이전 포스트](../pytorch-autograd) 에서는 ML/DL에서 backpropagation과 pytorch의 AutoGrad engine이 어떻게 작동하는지 공부해 보았다. 이 기능이 단순 스칼라 연산이 아닌, 실제로 사용 될 때는 훨씬 복잡한 계산을 거치게 된다. 간단한 partial derivative 부터 시작해보자.

### Partial Derivatives
n 차원에서 1차원으로 매핑하는 함수가 있다고 가정해보자. 다른 말로 n개의 변수를 가지는 함수가 한개의 숫자, 즉 scalar값을 output으로 가진다고 생각하자. 그 중, \\(i\\)번째 변수 \\(x_i\\)에 대해 differentiate 하게 되면 아래과 같이 partial derivative로 나타낼 수 있다.

$$
f:ℝ^{n} \rightarrow ℝ
$$

$$f(x_1, x_2, \cdots, x_{i-1}, x_i, x_{i+1}, \cdots, x_n)$$

Example:


$$f(x_1, x2)=x^2_1+x^2_2$$

$$\frac{\partial f}{\partial x_1}=2x_1$$

$$\frac{\partial f}{\partial x_2}=2x_2$$

혹은 `gradient`를 사용하여 모든 변수의 편미분 값을 구하게 되면,

$$\nabla f(x)= \begin{bmatrix}
\frac{\partial f}{\partial x_1} \\
\vdots \\
\frac{\partial f}{\partial x_n}\end{bmatrix}$$

Example:


$$f(\mathbf{x})=\left\|x\right\|_{2}^2=\mathbf{x}^T\mathbf{x}=x_1^2+\cdots+x_n^2$$

$$\nabla f(x)= \begin{bmatrix}
\frac{\partial f}{\partial x_1} \\
\vdots \\
\frac{\partial f}{\partial x_n}\end{bmatrix}=
\begin{bmatrix}
2x_1 \\
\vdots \\
2x_n\end{bmatrix}=
2\begin{bmatrix}
x_1 \\
\vdots \\
x_n\end{bmatrix}=2\mathbf{x} $$

### Backward for non-scalar variables
조금 더 복잡한 상황을 생각해보자. n차원의 변수로 m차원으로 가는 함수 f가 있다고 할때, 위와 같이 각각의 모든 차원에 대해 모든 편미분 값을 구해야 한다. 이것을 calculus 수업에서 배웠던 `Jacobian Matrix`라고 한다. 함수의 1차 partial derivative 값이 \\(ℝ^n\\)의 실수 벡터 공간에서 존재한다고 하면, jacobian 은 다음과 같이 \\(m \times n\\)행렬로 정의 할 수 있다.

$$
J = 
\begin{bmatrix}
    \frac{\partial f_1}{\partial x_1} & \frac{\partial f_1}{\partial x_2} & \cdots & \frac{\partial f_1}{\partial x_n} \\
    \frac{\partial f_2}{\partial x_1} & \frac{\partial f_2}{\partial x_2} & \cdots & \frac{\partial f_2}{\partial x_n} \\
    \vdots & \vdots & \ddots & \vdots \\
    \frac{\partial f_m}{\partial x_1} & \frac{\partial f_m}{\partial x_2} & \cdots & \frac{\partial f_m}{\partial x_n} \\
\end{bmatrix}
$$

Input 과 output이 아래와 같이 정의 될 때, jacobian은 다음과 같다. 

$$\mathbf{x}=\begin{bmatrix}x_1\\ x_2 \\ x_3\end{bmatrix}\rightarrow 
\mathbf{y}=\begin{bmatrix}x_1^2\\ x_2^2 \\ x_3^2\end{bmatrix}$$

$$f:ℝ^3 \rightarrow ℝ^3$$

$$\begin{align}J
&=\left[\frac{\partial \mathbf{y}}{\partial x_1},\frac{\partial \mathbf{y}}{\partial x_2},\frac{\partial \mathbf{y}}{\partial x_3}\right]\\
&=\begin{bmatrix}
    \frac{\partial y_1}{\partial x_1} & \frac{\partial y_1}{\partial x_2} & \frac{\partial y_1}{\partial x_3} \\
    \frac{\partial y_2}{\partial x_1} & \frac{\partial y_2}{\partial x_2} & \frac{\partial y_2}{\partial x_3} \\
    \frac{\partial y_3}{\partial x_1} & \frac{\partial y_3}{\partial x_2} & \frac{\partial y_3}{\partial x_3} \\
\end{bmatrix}
\end{align}$$

### Pytorch Implementation
코드로 위 계산을 증명해보자.
```python
import torch

x = torch.arange(3.0, requires_grad=True)
y = x * x

y.backward(torch.tensor([1., 1., 1.]))

print(x.grad)
```

```console
$ tensor([0., 2., 4.])
```

각 원소들이 0, 1, 2 로 arange 되고, 각 변수를 미분한 값은 0, 2, 4가 된다. 당연히 대각 원소를 제외한 원소는 0이 된다. 1, 1, 1 벡터와 곱을 해주게 되면 위 결과처럼 [0., 2., 4.]가 나오게 된다.


다른 예제를 보자.

$$
\textbf{Q} = 3\textbf{a}^3 - \textbf{b}^2
$$


$$
\textbf{a} = \begin{bmatrix} a_1 \\ a_2 \end{bmatrix}, \quad \textbf{b} = \begin{bmatrix} b_1 \\ b_2 \end{bmatrix}
, \quad 
\textbf{Q} = \begin{bmatrix} Q_1 \\ Q_2 \end{bmatrix} = \begin{bmatrix} 3a_1^3 - b_1^2 \\ 3a_2^3 - b_2^2 \end{bmatrix}
$$

$$\begin{align}J 
&= \begin{bmatrix}
\frac{\partial Q_1}{\partial a_1} & \frac{\partial Q_1}{\partial b_1} & \frac{\partial Q_1}{\partial a_2} & \frac{\partial Q_1}{\partial b_2} \\
\frac{\partial Q_2}{\partial a_1} & \frac{\partial Q_2}{\partial b_1} & \frac{\partial Q_2}{\partial a_2} & \frac{\partial Q_2}{\partial b_2} \\
\end{bmatrix} \\
&= \begin{bmatrix}
9a_1^2 & -2b_1 & 0 & 0 \\
0 & 0 & 9a_2^2 & -2b_2 \\
\end{bmatrix}\end{align}$$

$$
\begin{align}
J^T \cdot \textbf{v} &= \begin{bmatrix}
9a_1^2 & 0 \\
-2b_1 & 0 \\
0 & 9a_2^2 \\
0 & -2b_2 \\
\end{bmatrix} \cdot \begin{bmatrix} 1 \\ 1 \end{bmatrix} \\
&= 
\begin{bmatrix}
9a_1^2 \\
-2b_1\\
9a_2^2 \\
-2b_2 \\
\end{bmatrix}
\end{align}
$$

```python
import torch

a = torch.tensor([2., 3.], requires_grad=True)
b = torch.tensor([6., 4.], requires_grad=True)

Q = 3*a**3 - b**2

grad = torch.tensor([1., 1.])

Q.backward(gradient=grad)

print(a.grad, b.grad)
```

```console
tensor([36., 81.]) tensor([-12., -8.])
```

손계산과 동일한 결과가 나오는 것을 볼 수 있다.

---
참고자료
- *<https://pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html>*

- *<https://velog.io/@olxtar/PyTorch-Autograd-with-Jacobian>*

- *<https://youtu.be/MswxJw-8PvE>*