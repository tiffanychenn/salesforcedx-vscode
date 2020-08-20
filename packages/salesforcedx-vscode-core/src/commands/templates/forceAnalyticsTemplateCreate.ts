/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { AnalyticsTemplateOptions, TemplateType } from '@salesforce/templates';

import {
  Command,
  SfdxCommandBuilder
} from '@salesforce/salesforcedx-utils-vscode/out/src/cli';
import {
  CancelResponse,
  ContinueResponse,
  DirFileNameSelection,
  ParametersGatherer
} from '@salesforce/salesforcedx-utils-vscode/out/src/types';
import * as vscode from 'vscode';
import { nls } from '../../messages';
import { sfdxCoreSettings } from '../../settings';
import {
  CompositeParametersGatherer,
  PathStrategyFactory,
  SelectOutputDir,
  SfdxCommandlet,
  SfdxWorkspaceChecker,
  SourcePathStrategy
} from '../util';
import { BaseTemplateCommand } from './baseTemplateCommand';
import { LibraryBaseTemplateCommand } from './libraryBaseTemplateCommand';
import {
  ANALYTICS_TEMPLATE_DIRECTORY,
  ANALYTICS_TEMPLATE_TYPE
} from './metadataTypeConstants';

export class LibraryForceAnalyticsTemplateCreateExecutor extends LibraryBaseTemplateCommand<
  DirFileNameSelection
> {
  public executionName = nls.localize('force_analytics_template_create_text');
  public telemetryName = 'force_analytics_template_create';
  public metadataTypeName = ANALYTICS_TEMPLATE_TYPE;
  public templateType = TemplateType.AnalyticsTemplate;
  public getFileExtension(): string {
    return '.json';
  }
  public getOutputFileName(data: DirFileNameSelection) {
    return data.fileName;
  }
  public constructTemplateOptions(data: DirFileNameSelection) {
    const templateOptions: AnalyticsTemplateOptions = {
      outputdir: data.outputdir,
      templatename: data.fileName
    };
    return templateOptions;
  }
  public getDefaultDirectory() {
    return ANALYTICS_TEMPLATE_DIRECTORY;
  }
  public getSourcePathStrategy(): SourcePathStrategy {
    return PathStrategyFactory.createWaveTemplateBundleStrategy();
  }
}

export class ForceAnalyticsTemplateCreateExecutor extends BaseTemplateCommand {
  constructor() {
    super(ANALYTICS_TEMPLATE_TYPE);
  }
  public getFileExtension(): string {
    return '.json';
  }
  public build(data: TemplateAndDir): Command {
    return new SfdxCommandBuilder()
      .withDescription(nls.localize('force_analytics_template_create_text'))
      .withArg('force:analytics:template:create')
      .withFlag('--outputdir', data.outputdir)
      .withFlag('--templatename', data.fileName)
      .withLogName('force_analytics_template_create')
      .build();
  }

  public sourcePathStrategy: SourcePathStrategy = PathStrategyFactory.createWaveTemplateBundleStrategy();

  public getDefaultDirectory() {
    return ANALYTICS_TEMPLATE_DIRECTORY;
  }
}

export type TemplateAndDir = DirFileNameSelection & Template;

export interface Template {
  // fileName is the templateName
  fileName: string;
}

export class SelectProjectTemplate implements ParametersGatherer<Template> {
  public async gather(): Promise<CancelResponse | ContinueResponse<Template>> {
    const projectTemplateInputOptions = {
      prompt: nls.localize('force_analytics_template_name_text')
    } as vscode.InputBoxOptions;
    const fileName = await vscode.window.showInputBox(
      projectTemplateInputOptions
    );

    return fileName
      ? { type: 'CONTINUE', data: { fileName } }
      : { type: 'CANCEL' };
  }
}

const outputDirGatherer = new SelectOutputDir(ANALYTICS_TEMPLATE_DIRECTORY);

const parameterGatherer = new CompositeParametersGatherer(
  new SelectProjectTemplate(),
  outputDirGatherer
);

export async function forceAnalyticsTemplateCreate() {
  const createTemplateExecutor = sfdxCoreSettings.getTemplatesLibrary()
    ? new LibraryForceAnalyticsTemplateCreateExecutor()
    : new ForceAnalyticsTemplateCreateExecutor();
  const commandlet = new SfdxCommandlet(
    new SfdxWorkspaceChecker(),
    parameterGatherer,
    createTemplateExecutor
  );
  await commandlet.run();
}
