export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getEthereum(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum || null;
}

export async function connectWallet(): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('MetaMask не найден. Установи расширение.');
  const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts?.[0]) throw new Error('Нет аккаунтов');
  return accounts[0];
}

export async function getChainId(): Promise<number> {
  const eth = getEthereum();
  if (!eth) return 0;
  const hex = (await eth.request({ method: 'eth_chainId' })) as string;
  return parseInt(hex, 16);
}

export async function switchChain(chainId: number): Promise<void> {
  const eth = getEthereum();
  if (!eth) throw new Error('No provider');
  await eth.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x' + chainId.toString(16) }],
  });
}

export async function personalSign(message: string, address: string): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No provider');
  return (await eth.request({
    method: 'personal_sign',
    params: [message, address],
  })) as string;
}

export async function sendNative(to: string, valueWei: bigint): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No provider');
  const from = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  return (await eth.request({
    method: 'eth_sendTransaction',
    params: [{ from: from[0], to, value: '0x' + valueWei.toString(16) }],
  })) as string;
}

export async function sendContract(to: string, data: `0x${string}`): Promise<string> {
  const eth = getEthereum();
  if (!eth) throw new Error('No provider');
  const from = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  return (await eth.request({
    method: 'eth_sendTransaction',
    params: [{ from: from[0], to, data, value: '0x0' }],
  })) as string;
}
