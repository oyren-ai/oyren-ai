export interface VerificationResult<T, E = string> {
  data?: T;
  error?: E;
}
