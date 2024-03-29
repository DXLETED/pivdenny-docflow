import React, { useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import dict from 'dictionary.json'
import { documentsActions, getDocuments, getNextDocuments } from 'store/documents'
import { getUsers } from 'store/users'
import { Table } from 'components/table/Table'
import { useDispatchTyped } from 'hooks/dispatchTyped.hook'
import { useRequest } from 'hooks/request.hook'
import { requestsStatus } from 'utils/requestsStatus'
import { Loading } from 'components/Loading'
import { Error } from 'components/Error'
import { TableFilter } from 'components/table/TableFilter'
import { TableSearch } from 'components/table/TableSearch'
import { TableSwitch } from 'components/table/TableSwitch'
import { useTranslation } from 'react-i18next'

const statusColors: { [key in keyof typeof dict.documentStatus]: string } = {
  IN_PROGRESS: '#cdca1d',
  RESOLVED: '#57D7CA',
  REJECTED: '#CD451D',
  ARCHIVED: '#EDEDED',
}

interface DocumentsProps {
  id: string
  label?: string
  path: string
  head: { [key: string]: string }
  statusFilter?: boolean
  onlyWaitingSwitch?: boolean
}
export const Documents: React.FC<DocumentsProps> = ({
  id,
  label,
  path,
  head,
  statusFilter: statusFilterEnabled,
  onlyWaitingSwitch,
}) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [onlyWaiting, setOnlyWaiting] = useState(true)
  const [statusFilter, setStatusFilter] = useState<{ [el: string]: boolean }>({})
  const dispatch = useDispatchTyped()
  const [documents, documentsStatus, documentsError] = useRequest(
    s => s.documents,
    () => getDocuments({ path, search, statusFilter, onlyWaiting }),
    [search, statusFilter, onlyWaiting]
  )
  const [users, usersStatus, usersError] = useRequest(
    s => s.users,
    () => getUsers()
  )
  const els = useMemo(
    () =>
      documents.list.map(d => ({
        d: {
          id: d._id.slice(-8),
          author: users.find(u => u.userId === d.userId)?.username || d.userId,
          title: d.title,
          status: { d: t('document.status', { returnObjects: true })[d.status], color: statusColors[d.status] },
          creationDate: moment(d.createdAt).format(`DD.MM.YYYY`),
          updateDate: d.updatedAt ? moment(d.updatedAt).format(`DD.MM.YYYY`) : '-----',
        },
        link: `/documents/${d._id}`,
      })),
    [documents, users]
  )
  const status = requestsStatus(documentsStatus, usersStatus)
  useEffect(
    () => () => {
      dispatch(documentsActions.reset())
    },
    []
  )
  const load = () => dispatch(getNextDocuments({ path, search, statusFilter, onlyWaiting }))
  return (
    <>
      {status === 'done' && (
        <Table
          {...{ id, label, head, els, load }}
          menu={
            <>
              {onlyWaitingSwitch && (
                <TableSwitch enabled={onlyWaiting} set={setOnlyWaiting} label={t('documents.filter')} />
              )}
              {statusFilterEnabled && (
                <TableFilter
                  label={t('documents.head.status')}
                  options={dict.documentStatus}
                  filter={statusFilter}
                  set={setStatusFilter}
                />
              )}
              <TableSearch value={search} set={setSearch} />
            </>
          }
        />
      )}
      {status === 'loading' && <Loading />}
      {status === 'error' && <Error msg={[documentsError, usersError]} />}
    </>
  )
}
