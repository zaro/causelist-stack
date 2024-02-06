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
      run('cd /app && yarn install', trigger=['app//package.json', 'app//yarn.lock']),
  ])

docker_build('causelist-api', 'causelist-api',
  target='development',
  entrypoint='yarn start:dev',
  live_update=[
      sync('causelist-api/', '/api/'),
      run('cd /api && yarn install --no-progress', trigger=['causelist-api/package.json', 'causelist-api/yarn.lock']),
  ])

docker_build('kenyalaw-crawler', 'kenyalaw-crawler',
  target='development',
  entrypoint='sleep 365d',
  extra_tag='crawler-test',
  live_update=[
      sync('kenyalaw-crawler/', '/crawler-dev/'),
      run('cd /crawler-dev && yarn install --no-progress', trigger=['kenyalaw-crawler/package.json', 'kenyalaw-crawler/yarn.lock']),
  ])
#
local_resource('api-interfaces',
  './pre-build.sh',
  deps='causelist-api/src/interfaces'
)