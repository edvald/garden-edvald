/*
 * Copyright (C) 2018 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Environment } from "../../types/common"
import { Module, ModuleConfig } from "../../types/module"
import { Service, ServiceConfig } from "../../types/service"
import { ConfigurationError } from "../../exceptions"
import { GCloud } from "./gcloud"
import { ConfigureEnvironmentParams } from "../../types/plugin"

export const GOOGLE_CLOUD_DEFAULT_REGION = "us-central1"

export interface GoogleCloudServiceConfig extends ServiceConfig {
  project?: string
}

export interface GoogleCloudModuleConfig extends ModuleConfig<GoogleCloudServiceConfig> { }

export abstract class GoogleCloudModule extends Module<GoogleCloudModuleConfig> { }

export async function getEnvironmentStatus() {
  let sdkInfo

  const output = {
    configured: true,
    detail: {
      sdkInstalled: true,
      sdkInitialized: true,
      betaComponentsInstalled: true,
      sdkInfo: {},
    },
  }

  try {
    sdkInfo = output.detail.sdkInfo = await gcloud().json(["info"])
  } catch (err) {
    output.configured = false
    output.detail.sdkInstalled = false
  }

  if (!sdkInfo.config.account) {
    output.configured = false
    output.detail.sdkInitialized = false
  }

  if (!sdkInfo.installation.components.beta) {
    output.configured = false
    output.detail.betaComponentsInstalled = false
  }

  return output
}

export async function configureEnvironment({ ctx, status }: ConfigureEnvironmentParams) {
  if (!status.detail.sdkInstalled) {
    throw new ConfigurationError(
      "Google Cloud SDK is not installed. " +
      "Please visit https://cloud.google.com/sdk/downloads for installation instructions.",
      {},
    )
  }

  if (!status.detail.betaComponentsInstalled) {
    ctx.log.info({
      section: "google-cloud-functions",
      msg: `Installing gcloud SDK beta components...`,
    })
    await gcloud().call(["components update"])
    await gcloud().call(["components install beta"])
  }

  if (!status.detail.sdkInitialized) {
    ctx.log.info({
      section: "google-cloud-functions",
      msg: `Initializing SDK...`,
    })
    await gcloud().tty(["init"], { silent: false })
  }
}

export function gcloud(project?: string, account?: string) {
  return new GCloud({ project, account })
}

export function getProject<T extends GoogleCloudModule>(providerName: string, service: Service<T>, env: Environment) {
  // TODO: this is very contrived - we should rethink this a bit and pass
  // provider configuration when calling the plugin
  const provider = env.config.providers[providerName]
  return service.config.project || provider["default-project"] || null
}
