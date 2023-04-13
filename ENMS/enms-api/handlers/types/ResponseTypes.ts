interface BcResponseType {
  status: number;
  payload: {
    type: string;
    data: number[];
  };
  message: Buffer;
  stringMessage: string;
}

interface ApiMessageResponseType {
  status: number;
  message: string;
}

interface ApiMessagePayloadResponseType {
  status: number;
  message: string;
  payloadString: string;
}

export {
  BcResponseType,
  ApiMessageResponseType,
  ApiMessagePayloadResponseType,
};
