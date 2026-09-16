# Guía de MCP Readiness Check

`mcp-readiness-check` verifica un servidor MCP por stdio antes de conectarlo a un agente.

## Qué verifica

- inicialización MCP real e identidad del servidor;
- todas las páginas de tools, resources y prompts anunciados;
- capacidades anunciadas frente a catálogos accesibles;
- nombres, descripciones y anotaciones de las tools;
- schemas de entrada y salida según su dialecto JSON Schema declarado;
- indicadores estáticos de seguridad en instrucciones, metadatos y schemas;
- reportes seguros en consola, JSON y Markdown.

Los dialectos soportados son draft-07, 2019-09 y 2020-12. Un dialecto no soportado falla de forma explícita.

## Instalación local

```bash
git clone https://github.com/AvilaCarlosDev/mcp-readiness-check.git
cd mcp-readiness-check
npm ci
npm run build
```

## Uso

```bash
npm run dev -- check --cmd node --args examples/echo-server.mjs
npm run dev -- init
npm run dev -- check --server filesystem
npm run dev -- check --server filesystem --json
npm run dev -- check --server filesystem --markdown report.md
```

## Interpretación de seguridad

La auditoría de seguridad es análisis estático basado en evidencia. Revisa los metadatos anunciados para detectar lenguaje de prompt injection, valores de credenciales embebidos, entradas sensibles y anotaciones riesgosas o contradictorias. Los hallazgos heurísticos requieren revisión humana.

No ejecuta tools ni afirma ser una prueba de penetración. Usa `--no-security-audit` para desactivar esta capa.

Los valores de entorno suministrados y patrones comunes de credenciales se ocultan en los reportes. Revisa cada artefacto antes de compartirlo porque pueden existir formatos de secretos personalizados.

## Automatización

Los checks fallidos devuelven código `1`. Las advertencias permanecen visibles pero devuelven `0`, lo que permite usar la herramienta en CI sin convertir cada heurística en un bloqueo.

Este proyecto complementa MCP Inspector; no busca reemplazarlo.
