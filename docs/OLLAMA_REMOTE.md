# Ollama на отдельной машине

1. На машине с GPU/CPU:
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

2. В Admin OmniDev / env на VDS:
```
OLLAMA_BASE_URL=http://IP_ИЛИ_TAILSCALE:11434/v1
DEFAULT_LLM_PROVIDER=ollama
DEFAULT_LLM_MODEL=llama3.3
```

3. Firewall: 11434 только для IP сервера OmniDev.

4. Проверка: `curl http://HOST:11434/api/tags`

Клиенты Ollama не видят — только админ.
