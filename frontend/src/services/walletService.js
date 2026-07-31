import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

export const fetchWalletSummary = async () => (await api.get(API_ENDPOINTS.WALLET.SUMMARY)).data.data;
export const fetchTransactions = async () => (await api.get(API_ENDPOINTS.WALLET.TRANSACTIONS)).data.data;
export const fetchBankAccounts = async () => (await api.get(API_ENDPOINTS.BANK_ACCOUNTS)).data.data;
export const createWithdrawal = async (data) => (await api.post(API_ENDPOINTS.WITHDRAWALS.CREATE, data)).data.data;
export const fetchMyWithdrawals = async () => (await api.get(API_ENDPOINTS.WITHDRAWALS.MINE)).data.data;
export const cancelWithdrawal = async (id) => (await api.patch(API_ENDPOINTS.WITHDRAWALS.CANCEL(id))).data.data;
