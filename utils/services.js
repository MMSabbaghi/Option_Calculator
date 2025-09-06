const SHEETDB_API = "https://sheetdb.io/api/v1/4xkud7vrc6wtz";

async function saveDataToSheet(trade) {
  try {
    await fetch(SHEETDB_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: trade }),
    });
    showToast("معامله با موفقیت ثبت شد.", "success");
    return { isSucsess: true };
  } catch (error) {
    showToast("خطا در ذخیره سازی داده ", "error");
    return { isSucsess: false };
  }
}

async function getDataFromSheet() {
  const res = await fetch(SHEETDB_API);
  const data = await res.json();
  return data;
}
