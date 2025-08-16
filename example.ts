// Ruta: /code-pilot/example.ts

function fibonacci(n: number): number {
  if (n <= 1) {
    return n;
  }

  let a = 0;
  let b = 1;

  for (let i = 2; i <= n; i++) {
    const nextFib = a + b;
    a = b;
    b = nextFib;
  }

  return b;
}

console.log(`El 10º número de Fibonacci es: ${fibonacci(10)}`);

/*
// Un chiste para terminar:
¿Por qué los programadores prefieren el modo oscuro?
Porque la luz atrae a los bugs.
*/