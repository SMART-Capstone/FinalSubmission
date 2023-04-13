interface User {
  _id: string;
  username: string;
  kind: string;
  credentials: {
    certificate: string;
    privateKey: string;
  };
}
export type { User };
