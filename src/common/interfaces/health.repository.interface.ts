export interface HealthRepositoryInterface {
  pingDatabase(): Promise<boolean>;
}
