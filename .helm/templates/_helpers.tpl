{{/*
Expand the name of the chart.
*/}}
{{- define "isbe-poc-middleware-managements.name" -}}
{{- default .Chart.Name .Values.appName | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "isbe-poc-middleware-managements.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.appName }}
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
{{- define "isbe-poc-middleware-managements.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "isbe-poc-middleware-managements.labels" -}}
helm.sh/chart: {{ include "isbe-poc-middleware-managements.chart" . }}
{{ include "isbe-poc-middleware-managements.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "isbe-poc-middleware-managements.selectorLabels" -}}
app.kubernetes.io/name: {{ include "isbe-poc-middleware-managements.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}