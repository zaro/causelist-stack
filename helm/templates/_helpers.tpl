{{/*
Expand the name of the chart.
*/}}
{{- define "causelist-stack.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "causelist-stack.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "causelist-stack.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "causelist-stack.labels" -}}
{{- $current := "" }}
{{- if  (kindIs "slice" . ) }}
{{- $current = index . 0 }}
{{- else }}
{{- $current = . }}
{{- end }}
helm.sh/chart: {{ include "causelist-stack.chart" $current }}
{{ include "causelist-stack.selectorLabels" . }}
{{- if $current.Chart.AppVersion }}
app.kubernetes.io/version: {{ $current.Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ $current.Release.Service }}
{{- end }}


{{/*
Selector labels
*/}}
{{- define "causelist-stack.selectorLabels" -}}
{{- $current := "" }}
{{- $name := "" -}}
{{- if  (kindIs "slice" . ) }}
{{- $current = index . 0 }}
{{- $name = (index . 1) -}}
{{- else }}
{{- $current = . }}
{{- $name = include "causelist-stack.name" $current -}}
{{- end }}
app.kubernetes.io/name: {{ $name }}
app.kubernetes.io/instance: {{ $current.Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "causelist-stack.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "causelist-stack.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of directus env config
*/}}
{{- define "causelist-stack.cmNameForApi" -}}
api-env-{{ get . "env" | toYaml | sha256sum | trunc 8 }}
{{- end -}}

{{- define "causelist-stack.cmNameForApp" -}}
app-env-{{ get . "env" | toYaml | sha256sum | trunc 8 }}
{{- end -}}