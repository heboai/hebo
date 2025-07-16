import { proxy } from "valtio";

export type NewAgent = {
  name: string;
  model: string;
};

export const agentStore = proxy({
  newAgent: null as null | NewAgent,
  saving: false,
  error: null as null | string,
}); 