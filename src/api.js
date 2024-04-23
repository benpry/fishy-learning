const API_BASE_URL = "https://chains-api-21415a7171bd.herokuapp.com";

export async function assignToChain(condition) {
  const response = await fetch(`${API_BASE_URL}/assign/${condition}`, {
    method: "GET",
    mode: "cors",
  });
  const chain = await response.json();
  return chain;
}

export async function assignToChainNoBusy(condition) {
  const response = await fetch(`${API_BASE_URL}/assign/no-busy/${condition}`, {
    method: "GET",
    mode: "cors",
  });
  const chain = await response.json();
  return chain;
}

export async function freeChain(chainId) {
  const response = await fetch(`${API_BASE_URL}/free/${chainId}`, {
    method: "POST",
    mode: "cors",
  });
  return response.json();
}

export async function sendMessage(chainId, message) {
  const response = await fetch(`${API_BASE_URL}/chain/complete/${chainId}`, {
    method: "POST",
    mode: "cors",
    body: JSON.stringify({ message: message }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const sentMessage = await response.json();
  return sentMessage;
}

export async function updateReads(chainId) {
  const response = await fetch(`${API_BASE_URL}/chain/read/${chainId}`, {
    method: "POST",
    mode: "cors",
  });
  const updatedChain = await response.json();
  return updatedChain;
}
