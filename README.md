# 🔐 Password Generator

Um gerador de senhas gratuito, simples e personalizável, executado no
navegador. O objetivo deste projeto é permitir criar senhas de acordo
com as preferências do utilizador e, opcionalmente, verificar se uma
senha aparece na base de dados de senhas expostas da Have I Been Pwned.

> **Estado do projeto:** este README descreve as funcionalidades
> previstas para a versão melhorada. Confirma que cada funcionalidade
> está implementada e testada no código antes de a anunciares como
> disponível na versão publicada.

## ✨ Funcionalidades

### Gerar senhas

-   Definir o comprimento da senha.
-   Escolher os tipos de caracteres permitidos:
    -   Letras maiúsculas (`A-Z`)
    -   Letras minúsculas (`a-z`)
    -   Números (`0-9`)
    -   Caracteres especiais
-   Definir um número mínimo de números e de caracteres especiais.
-   Excluir caracteres ambíguos, como `I`, `l`, `1`, `O` e `0`.
-   Gerar uma nova senha sem recarregar a página.
-   Mostrar ou ocultar a senha gerada.
-   Copiar a senha para a área de transferência.
-   Consultar uma estimativa indicativa da força e da entropia da senha.

### Verificação opcional de exposição

A ferramenta pode verificar, apenas quando o utilizador o solicita, se
uma senha consta da base de dados **Pwned Passwords**, mantida pela
[Have I Been Pwned](https://haveibeenpwned.com/Passwords).

A verificação é uma funcionalidade separada da geração: não é executada
automaticamente ao criar uma senha.

## 🛡️ Privacidade e segurança

A geração deve ocorrer localmente no navegador, utilizando a API Web
Crypto (`crypto.getRandomValues()`) para obter aleatoriedade
criptograficamente segura.

Na verificação Pwned Passwords, o fluxo recomendado é:

1.  Calcular o hash SHA-1 da senha no navegador.
2.  Enviar à API apenas os primeiros cinco caracteres do hash.
3.  Receber os sufixos correspondentes e comparar localmente o restante
    hash.
4.  Não enviar a senha em texto simples nem o hash completo.

Este mecanismo é conhecido como *k-anonymity*. Mesmo assim, o prefixo do
hash é enviado ao serviço externo quando a verificação é solicitada.
Consulta a [documentação oficial da
API](https://haveibeenpwned.com/API/V3).

**Importante:** - Uma senha não encontrada não é garantia de que nunca
tenha sido exposta. - Se o serviço estiver indisponível, a aplicação
deve indicar que não foi possível concluir a verificação --- nunca
afirmar que a senha é segura. - A estimativa de força/entropia é
indicativa e não substitui uma avaliação de segurança. - Não introduzas
senhas reais em versões de demonstração ou ambientes em que não
confies. - A aplicação não deve guardar senhas, hashes completos ou
resultados sensíveis em `localStorage`, cookies ou logs.

## 🚀 Como executar localmente

O projeto utiliza HTML, CSS e JavaScript no navegador e não necessita de
um processo de compilação, desde que não sejam adicionadas dependências.

1.  Clona o repositório:

    ``` bash
    git clone https://github.com/polimpo4/Password-Generator.git
    cd Password-Generator
    ```

2.  Abre a pasta no teu editor de código.

3.  Para testar através de um servidor local, executa:

    ``` bash
    python -m http.server 8000
    ```

4.  Abre <http://localhost:8000>.

Para testar a verificação com Web Crypto, utiliza HTTPS ou `localhost`.
A consulta à API necessita de ligação à Internet e pode ser afetada
pelas políticas de rede ou CORS do navegador.

## 🧪 Verificações recomendadas

Antes de publicar alterações, confirma que:

-   O comprimento gerado corresponde ao selecionado.
-   Os mínimos de números e símbolos são respeitados.
-   As configurações inválidas são recusadas com uma mensagem clara.
-   A geração utiliza aleatoriedade criptograficamente segura.
-   Copiar e mostrar/ocultar funcionam.
-   A verificação só ocorre após uma ação explícita.
-   A senha original e o hash completo nunca são enviados à API.
-   Resultados positivos, negativos, timeout e falhas de rede são
    apresentados corretamente.
-   A interface funciona em computadores e dispositivos móveis.

## 🧰 Tecnologias

-   HTML5
-   CSS3
-   JavaScript
-   Web Crypto API
-   [Have I Been Pwned --- Pwned Passwords
    API](https://haveibeenpwned.com/API/V3) (para a verificação
    opcional)

## 🤝 Contribuir

Sugestões, correções e melhorias são bem-vindas. Ao propor alterações
relacionadas com segurança, inclui os passos de reprodução e testes
relevantes, sem partilhar senhas reais ou outros segredos.

## 📄 Licença

Consulta o ficheiro `LICENSE` do repositório para conhecer os termos de
utilização e distribuição.
