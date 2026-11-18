(() => {
  const source = document.getElementById("source");
  const convert = document.getElementById("convert");
  const clear = document.getElementById("clear");
  const copy = document.getElementById("copy");
  const result = document.getElementById("result");
  const status = document.getElementById("engine-status");
  const dot = document.getElementById("engine-dot");
  const charCount = document.getElementById("char-count");
  const resultCount = document.getElementById("result-count");
  const copyStatus = document.getElementById("copy-status");
  let tokenizer = null;
  let outputText = "";

  function setEngineState(message, state) {
    status.textContent = message;
    dot.className = "status-dot" + (state ? " " + state : "");
  }

  function toTag(token) {
    const pos = token.pos;
    if (pos === "記号" || pos === "空白" || pos === "補助記号") return null;
    const map = {
      "名詞": "名詞", "助詞": "助詞", "動詞": "動詞", "助動詞": "助動詞",
      "形容詞": "形容詞", "形容動詞": "形容動詞", "副詞": "副詞",
      "感動詞": "感動詞", "接続詞": "接続詞", "連体詞": "連体詞",
      "接頭詞": "接頭詞"
    };
    return map[pos] || "その他";
  }

  function renderTokens(tokens) {
    result.replaceChildren();
    outputText = "";
    let count = 0;
    for (const token of tokens) {
      const tag = toTag(token);
      if (!tag) {
        result.append(document.createTextNode(token.surface_form));
        outputText += token.surface_form;
      } else {
        const label = "[" + tag + "]";
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = label;
        result.append(span);
        outputText += label;
        count++;
      }
    }
    result.classList.remove("empty");
    resultCount.textContent = count + " tags";
    copy.disabled = outputText.length === 0;
    copyStatus.textContent = "";
  }

  function runConversion() {
    const text = source.value;
    if (!tokenizer || !text.trim()) return;
    try {
      renderTokens(tokenizer.tokenize(text));
    } catch (error) {
      setEngineState("解析に失敗しました。入力を短くしてお試しください。", "error");
      console.error(error);
    }
  }

  source.addEventListener("input", () => {
    charCount.textContent = source.value.length.toLocaleString("ja-JP") + " / 2,000";
    copyStatus.textContent = "";
  });
  convert.addEventListener("click", runConversion);
  clear.addEventListener("click", () => {
    source.value = "";
    source.dispatchEvent(new Event("input"));
    result.textContent = "ここに変換結果が表示されます。";
    result.classList.add("empty");
    resultCount.textContent = "0 tokens";
    outputText = "";
    copy.disabled = true;
    copyStatus.textContent = "";
    source.focus();
  });
  copy.addEventListener("click", async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      copyStatus.textContent = "コピーしました";
    } catch {
      copyStatus.textContent = "コピーできませんでした";
    }
  });

  if (!window.kuromoji) {
    setEngineState("解析エンジンを読み込めません。通信環境を確認してください。", "error");
    return;
  }
  setEngineState("辞書データを読み込み中…", "");
  window.kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" }).build((error, instance) => {
    if (error) {
      setEngineState("辞書の読み込みに失敗しました。ページを再読み込みしてください。", "error");
      console.error(error);
      return;
    }
    tokenizer = instance;
    setEngineState("解析エンジン準備完了", "ready");
    convert.disabled = false;
  });
})();