/*
 * Copyright (C) 2018 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TaskResults } from "../task-graph"
import { TreeVersion } from "../vcs/base"
import { v1 as uuidv1 } from "uuid"

export class TaskDefinitionError extends Error { }

export interface TaskVersion {
  version: TreeVersion
}

export interface TaskParams {
  version?: TreeVersion
}

export abstract class Task {
  abstract type: string
  id: string
  version: TreeVersion

  dependencies: Task[]

  constructor(initArgs: TaskParams & TaskVersion) {
    this.dependencies = []
    this.id = uuidv1() // uuidv1 is timestamp-based
    this.version = initArgs.version
  }

  async getDependencies(): Promise<Task[]> {
    return this.dependencies
  }

  protected abstract getName(): string

  getBaseKey(): string {
    return `${this.type}.${this.getName()}`
  }

  getKey(): string {
    return `${this.getBaseKey()}.${this.id}`
  }

  abstract getDescription(): string

  abstract async process(dependencyResults: TaskResults): Promise<any>
}
