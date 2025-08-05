import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';
import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { MLModelService, IMLModelService } from '../core/ml-model-service';
import { ShapExplainer, IShapExplainer } from '../core/shap-explainer';

/**
 * Dependency injection container configuration
 */
export class DIContainer {
  private static instance: Container;

  public static getInstance(): Container {
    if (!DIContainer.instance) {
      DIContainer.instance = new Container();
      DIContainer.configureContainer();
    }
    return DIContainer.instance;
  }

  private static configureContainer(): void {
    const container = DIContainer.instance;

    // Core services
    container.bind<Logger>(TYPES.Logger).to(Logger).inSingletonScope();
    container.bind<Config>(TYPES.Config).to(Config).inSingletonScope();

    // ML Services
    container.bind<IMLModelService>(TYPES.MLModelService).to(MLModelService).inSingletonScope();
    container.bind<IShapExplainer>(TYPES.ShapExplainer).to(ShapExplainer).inSingletonScope();

    // Note: Other service bindings will be added as services are implemented
    // This follows the incremental development approach specified in the requirements
  }

  public static reset(): void {
    if (DIContainer.instance) {
      DIContainer.instance.unbindAll();
      DIContainer.instance = new Container();
      DIContainer.configureContainer();
    }
  }
}