tilt_values_yaml = './values-tilt.yaml'
watch_file(tilt_values_yaml)

yaml = helm(
  'helm',
  # The release name, equivalent to helm --name
  name='causelist-stack',
  # The namespace to install in, equivalent to helm --namespace
  namespace='causelist-dev',
  # The values file to substitute into the chart.
  values=[tilt_values_yaml],
  # Values to set from the command-line
  set=[]
  )
k8s_yaml(yaml)

docker_build('causelist-app', 'app',
  target='development',
  entrypoint='yarn dev',
  live_update=[
      sync('app/', '/app/'),
  ])

docker_build('causelist-api', 'causelist-api',
  target='development',
  entrypoint='yarn start:dev',
  live_update=[
      sync('causelist-api/', '/api/'),
  ])

#
local_resource('api-interfaces',
  './pre-build.sh',
  deps='causelist-api/src/interfaces'
)